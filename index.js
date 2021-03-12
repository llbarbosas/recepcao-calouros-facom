// Criação do icone de notificação
// https://heroicons.com/
const bellIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#a0a0a0" width="20px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`
const solidBellIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#a0a0a0" width="20px"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>`

// Conversão de uma data JavaScript para o formato de data do Google Calendar (Ymd\\THi00\\Z)
const dateToCalendarDate = date => date.toISOString().replace(/-|:|\./g, "")

const createReminderAnchor = ({ id, nextHref, href, target, icon }) =>
    `<a id="${id}" onclick="toggleReminder('${id}')" data-href="${nextHref}" href="${href}" target="${target}">${icon}</a>`

// Criação do link com a URL do evento no Google Calendar
// O _reminderId_ é gerado a partir da timestamps de início + fim do evento (que nesse caso, é único)
const createReminderElement = ({ title, details, start, end }) => {
    const calendarStart = dateToCalendarDate(start)
    const calendarEnd = dateToCalendarDate(end)
    const reminderId = calendarStart + calendarEnd

    const reminderValue = window.localStorage.getItem(reminderId)

    const icon = reminderValue === 'true' ? solidBellIcon : bellIcon
    const googleCalendarURL = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${title}&details=${details}&dates=${calendarStart}/${calendarEnd}&ctz=America/Campo_Grande`
    const reminderActualHref = reminderValue === 'true' ? "#" : googleCalendarURL
    const reminderNextHref = reminderValue === 'true' ? googleCalendarURL : "#"
    const reminderTarget = reminderValue === 'true' ? "" : "_blank"

    const reminderAnchor = createReminderAnchor({
        id: reminderId,
        nextHref: reminderNextHref,
        href: reminderActualHref,
        target: reminderTarget,
        icon
    })

    return `<td>${reminderAnchor}</td>`
}

// Função utilitária
const delay = ms => new Promise(res => setTimeout(res, ms));

// Troca o estado do botão de adicionar notificação
// Utiliza o _localStorage_ para armazenar esse estado
const toggleReminder = async reminderId => {
    // Delay para previnir a manipulação do elemento antes
    // do redirecionamento.
    await delay(100)

    const reminderValue = window.localStorage.getItem(reminderId)
    const nextReminderIcon = reminderValue === 'true' ? bellIcon : solidBellIcon
    const reminderElement = document.getElementById(reminderId)
    const reminderTarget = reminderValue === 'true' ? "_blank" : ""

    if (reminderValue === 'true') {
        window.localStorage.removeItem(reminderId)
    } else {
        window.localStorage.setItem(reminderId, 'true')
    }

    reminderElement.parentNode.innerHTML = createReminderAnchor({
        id: reminderId,
        nextHref: reminderElement.href,
        href: reminderElement.dataset.href,
        icon: nextReminderIcon,
        target: reminderTarget
    })

}

// Converte uma data do tipo "dd/mm" e uma hora em uma data JavaScript
const parseDate = (date, hour) => {
    const dateParts = date.split("/")
    const hourParts = hour.split(":")

    return new Date(
        (new Date()).getFullYear(),
        parseInt(dateParts[1], 10) - 1,
        parseInt(dateParts[0], 10),
        parseInt(hourParts[0]),
        parseInt(hourParts[1])
    )
}

const events = document.getElementsByClassName('event')

// Helper para auxiliar na identificação do formato dos dados na linha na tabela
const isEventWithDate = eventChildren => eventChildren[0].classList.contains('date')
const isEventWithCourses = eventChildren => isEventWithDate(eventChildren) ? eventChildren.length === 4 : eventChildren.length === 3

const getDataFromEvent = event => {
    const children = Array.from(event.children)

    const courses = isEventWithCourses(children) && children[children.length - 1].innerHTML

    const isWithData = isEventWithDate(children)

    const [c1, c2, c3] = children

    const date = isWithData && c1.innerHTML
    const hour = isWithData ? c2.innerHTML : c1.innerHTML
    const title = isWithData ? c3.innerHTML : c2.innerHTML

    return {
        courses,
        hour,
        title,
        date
    }
}

function main() {
    let lastDate, lastCourses;

    Array.from(events).forEach((event, eventIndex) => {
        const { courses, hour, title, date } = getDataFromEvent(event)

        lastCourses = courses || lastCourses
        lastDate = date || lastDate

        const start = parseDate(lastDate, hour)

        const nextEvent = events.length > eventIndex + 1 && events[eventIndex + 1]

        // Se não existir um próximo evento, o horário final será
        // de 1h após o início do evento, por padrão.

        let end

        if (nextEvent) {
            const nextEventData = getDataFromEvent(nextEvent)
            end = parseDate(nextEventData.date || lastDate, nextEventData.hour)
        } else {
            const startClone = new Date(start)
            startClone.setHours(start.getHours() + 1)

            end = startClone
        }

        const reminderAnchor = createReminderElement({
            title,
            details: `Evento para as turmas de ${lastCourses}`,
            start,
            end,
        })

        event.insertAdjacentHTML('beforeend', reminderAnchor)
    })
}

main()




