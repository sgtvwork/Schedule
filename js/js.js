//Отрисовывает шахматку и возвращает как html объект
function DrawSchedule(scheduleData) {
    var schedule = {
        title: scheduleData.title != undefined && scheduleData.title.length > 0 ? scheduleData.title : 'Помещения',
        start: scheduleData.start != undefined ? moment(scheduleData.start).startOf('day') : moment().add('-2', 'days').startOf('day'),
        end: scheduleData.end != undefined ? moment(scheduleData.end).endOf('day') : moment().add('5', 'days').endOf('day'),
        inactiveZones: scheduleData.inactiveZones != undefined ? scheduleData.inactiveZones : null,
        locations: scheduleData.locations != undefined && scheduleData.locations.length > 0 ? scheduleData.locations : [],
        events: scheduleData.events != undefined && scheduleData.events.length > 0 ? scheduleData.events : [],
        scheduleEvents: scheduleData.scheduleEvents,
        contextMenu: scheduleData.contextMenu,
        resizeStep: scheduleData.resizeStep != undefined && scheduleData.resizeStep > 0 ? parseInt(scheduleData.resizeStep) : 1,
        eventMinWidth: scheduleData.eventMinWidth != undefined && scheduleData.eventMinWidth > 0 ? parseInt(scheduleData.eventMinWidth) : 1,
        goblin: scheduleData.goblin != true ? false : scheduleData.goblin,
        eventDefaultStartTime: scheduleData.eventDefaultStartTime != undefined ? scheduleData.eventDefaultStartTime : 9,
        allowMovingEventsToThePast: scheduleData.allowMovingEventsToThePast != undefined ? scheduleData.allowMovingEventsToThePast : false,
        allowEventsToOverlap: scheduleData.allowEventsToOverlap != undefined ? scheduleData.allowEventsToOverlap : false,
    }

    for (var i = 0; i < schedule.events.length; i++) {
        schedule.events[i].start = moment(schedule.events[i].start);
        schedule.events[i].end = moment(schedule.events[i].end);
    }

    try {
        //Контекстное меню 
        var lastContextMenuTarget;
        var defaultContextMenu = [
            {
                text: 'Создать',
                target: 'both',
                disabled: false,
                onClick: function (e) {
                    AddNewEvent(e)
                }
            },
            {
                text: 'Изменить',
                target: 'event',
                disabled: false,
                onClick: function (e) {
                    if (schedule.scheduleEvents.onContextMenuAction_Change) {
                        let $target = $(lastContextMenuTarget.target).closest('.EventDetail');
                        let data = JSON.parse(
                            $($target).data('data')
                        ) 
                        schedule.scheduleEvents.onContextMenuAction_Change(data)
                    }
                }
            },
            {
                text: 'Клонировать',
                target: 'event',
                disabled: true,
                onClick: function (e) {
                    alert(e.target)
                }
            },
            {
                text: 'Удалить',
                target: 'event',
                disabled: false,
                onClick: function (e) {
                    deleteEvent()
                }
            }
        ];

        var dayContextMenu;

        if (schedule.contextMenu === 'default') {
            dayContextMenu = defaultContextMenu
        }
        else if (schedule.contextMenu) {
            dayContextMenu = defaultContextMenu.concat(schedule.contextMenu)
        }
        else {
            dayContextMenu = null
        }

        //Главный блок 
        var scheduleContainer = document.createElement('div');
        scheduleContainer.classList = 'p-0 ScheduleContainer';
        $(scheduleContainer).on('contextmenu', function () { return false; });
        var daysDifference = moment(schedule.end).startOf('day').diff(moment(schedule.start).startOf('day'), 'days') + 1;

        //Отрисовка шапки
        scheduleContainer.append(GetScheduleHeader(daysDifference));

        if (moment().startOf('day') >= schedule.start && moment().startOf('day') <= schedule.end) {

            var todayLine = document.createElement('div');
            todayLine.classList = 'todayLine';
            todayLine.style.left = 25
                + ((75 / daysDifference) * (moment().startOf('day').diff(moment(schedule.start).startOf('day'), 'days')))
                + (((75 / daysDifference) / 1440) * (moment().diff(moment().startOf('day'), 'minutes')))
                + '%';
            scheduleContainer.append(todayLine);
        }

        //Отрисовка помещений и событий
        for (var l = 0; l < schedule.locations.length; l++) {
            scheduleContainer.append(GetLocationRow(schedule.locations[l].id));
        }

        function GetLocationRow(locationId) {

            var location = schedule.locations.find(x => x.id == locationId);

            //#region Левая колонка
            //Строка помещения
            var eventRow = document.createElement('div');
            eventRow.classList = 'row LocationRow';

            //Помещение
            var locationDiv = document.createElement('div');
            locationDiv.classList = 'col-3 LocationsContainer';
            $(locationDiv).append(location.name);
            eventRow.append(locationDiv);

            //Id помещения
            var locationInput = document.createElement('input');
            locationInput.name = 'LocationId';
            locationInput.type = "hidden";
            locationInput.value = location.id;
            locationDiv.append(locationInput);

            //#endregion

            //#region Правая колонка
            //Столбец c расписанием    
            var eventsColumn = document.createElement('div');
            eventsColumn.classList = 'col-9 DaysContainer';
            eventRow.append(eventsColumn);

            var date = new Date(schedule.start).setHours(0, 0, 0, 0);

            //Уже отрисованные элементы в этой строке (нужен для определения отступа сверху)
            var alreadyPushedEvents = [];

            //Цикл отрисовки сетки дней
            for (var i = 0; i < daysDifference; i++) {

                //Колонка день
                var timeZone = document.createElement('li');
                timeZone.classList = 'ScheduleDay';
                timeZone.setAttribute('childnumber', i + 1);

                if (schedule.contextMenu) {
                    timeZone.addEventListener('contextmenu', DrawContextMenu);
                }

                timeZone.style = 'min-height: 3.2rem;';
                eventsColumn.append(timeZone);

                var dateInfo = document.createElement('input');
                dateInfo.type = 'hidden';
                dateInfo.name = 'Date';
                dateInfo.value = moment(date).format('YYYY-MM-DDTHH:mm:SS.000Z');
                timeZone.append(dateInfo);
                
                //Отрисовка неактивных зон
                if (schedule.inactiveZones) {
                    let zones = scheduleData.inactiveZones.filter(x => x.locationId == location.id)
                    if (zones.length > 0) {

                        for (let i = 0; i < zones.length; i++) {
                            const zoneStart = moment(zones[i].startTime)
                            const zoneEnd = moment(zones[i].startTime).clone().add(zones[i].duration, 'day')
                            if (
                                moment(date).isSameOrAfter(zoneStart)
                                &&
                                moment(date).isBefore(zoneEnd)
                            )
                            {
                                $(timeZone).addClass('scheduleInactiveZone')
                                $(timeZone).data('inactive', true)
                            }
                        }
                        
                    }
                }

                var locationInfo = document.createElement('input');
                locationInfo.type = 'hidden';
                locationInfo.name = 'LocationId';
                locationInfo.value = location.id;
                timeZone.append(locationInfo);

                //Получаем список событий начинающийся в этот день
                var events = schedule.events.filter(
                    x => x.locationId == location.id
                        && x.start >= moment(date).startOf('day')
                        && x.start <= moment(date).endOf('day')
                );

                //Получаем список событий начинающийся в этот день и ранее (если начало выходит за диапазон отрисовки)
                if (i == 0) {
                    events = schedule.events.filter(
                        x => x.locationId == location.id
                            && x.start <= moment(date).endOf('day')
                            && x.end >= schedule.start
                    ).sort(x => x.start);
                }

                //Отрисовка мероприятий в этот день
                if (events.length > 0) {
                    for (var e = 0; e < events.length; e++) {

                        var currEvent = events[e];

                        //Отступ сверху
                        var top = alreadyPushedEvents.filter(x => x.locationId == currEvent.locationId && x.start <= currEvent.end && x.end >= currEvent.start).length;

                        //Контейнер детали мероприятия (полоска)
                        var eventProgressContainer = document.createElement('div');
                        eventProgressContainer.classList = 'EventDetailContainer ' + currEvent.extClass;

                        //Контейнер детали мероприятия (полоска)
                        var eventProgress = document.createElement('div');
                        eventProgress.classList = 'EventDetail ' + currEvent.extClass;
                        eventProgress.setAttribute('data-bs-toggle', 'tooltip');
                        eventProgress.setAttribute('title', currEvent.name + ' \r\n' + currEvent.start.format('DD.MM.YYYY HH:mm') + ' - ' + currEvent.end.format('DD.MM.YYYY HH:mm'));

                        eventProgressContainer.append(eventProgress);

                        //Расчет длины события (не лезь сюда, оно тебя сожрет) 
                        if (currEvent.start >= schedule.start && currEvent.end <= schedule.end) {
                            eventProgressContainer.style.width = (currEvent.end.diff(currEvent.start, 'day', true) * 100) + '%';
                            eventProgressContainer.style.left = (currEvent.start.diff(moment(date), 'day', true) * 100) + '%';
                        }
                        else if (currEvent.start < schedule.start && currEvent.end > schedule.end) {
                            eventProgressContainer.style.width = (schedule.end.diff(schedule.start.startOf('day'), 'day', true) * 100) + '%';
                            eventProgressContainer.style.left = '0%';
                        }
                        else if (currEvent.start >= schedule.start) {
                            eventProgressContainer.style.width = (schedule.end.diff(currEvent.start, 'day', true) * 100) + '%';
                            eventProgressContainer.style.left = (currEvent.start.diff(moment(date), 'day', true) * 100) + '%';
                        }
                        else {
                            eventProgressContainer.style.width = (currEvent.end.diff(schedule.start, 'day', true) * 100) + '%';
                            eventProgressContainer.style.left = '0%';
                        }

                        eventProgressContainer.style.top = (top * 3.1 + 0.1) + 'rem';
                        timeZone.append(eventProgressContainer);

                        top++;

                        //Увеличиваем "родителя"
                        timeZone.style = 'min-height: ' + (top * 3.1 + 0.1) + 'rem;';

                        //Название мероприятия
                        var eventName = document.createElement('p');
                        eventName.classList = 'm-0 p-0 overflow-hidden text-nowrap fw-bold fs-6';
                        eventName.innerText = '[' + currEvent.id + '] ' + currEvent.name;
                        eventProgress.append(eventName);

                        //Продолжительность мероприятия
                        var eventDuration = document.createElement('p');
                        eventDuration.classList = 'm-0 p-0 overflow-hidden text-nowrap fs-6';
                        eventDuration.innerText = currEvent.start.format('DD.MM.YYYY HH:mm') + ' - ' + currEvent.end.format('DD.MM.YYYY HH:mm');
                        eventProgress.append(eventDuration);

                        $(eventProgress).data('data', JSON.stringify(currEvent))

                        //Добавляем в отрисованные
                        alreadyPushedEvents.push(currEvent);

                        //#region drag events

                        AddEventListeners(eventProgress, currEvent);

                        //#endregion drag events

                    }
                }

                date = moment(date).startOf('day').add('1', 'day');
            }

            //Включение ресайза
            $(eventRow).find('.EventDetailContainer').resizableSafe({
                resizeWidth: true,
                resizeHeight: false,
                onDragStart: schedule.scheduleEvents.onResizeStart !== null ? schedule.scheduleEvents.onResizeStart : null,
                onDragEnd: schedule.scheduleEvents.onResizeEnd !== null ? schedule.scheduleEvents.onResizeEnd : null,
                onDrag: schedule.scheduleEvents.onResize !== null ? schedule.scheduleEvents.onResize : null,
                eventMinWidth: schedule.eventMinWidth,
                resizeStep: schedule.resizeStep,
                redrawFunc: function (locationId, data) {
                    if (data) {
                        var event = schedule.events.find(x => x.id === data.eventId);
                        event.start = data.startDate;
                        event.end = data.endDate;
                    }
                    RedrawRow(locationId);
                },
                inactiveZones: schedule.inactiveZones
            });

            [].slice.call(eventRow.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (tooltipTriggerEl) {
                new bootstrap.Tooltip(tooltipTriggerEl).enable();
            });

            return eventRow;

            //#endregion
        }
        
        function AddEventListeners(eventProgress, currEvent) {
            if (currEvent.end.isBefore(moment())) {
                return
            }
            var oldEventParams;
            var currentDroppable;
            var isDragging = false;
            var draggingElement;
            var topPositionPrevious;
            var leftPositionPrevious;

            $(eventProgress).off('mousedown').on('mousedown', function (e) {
                switch (e.button) {
                    case 0: {
                        [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (tooltipTriggerEl) {
                            new bootstrap.Tooltip(tooltipTriggerEl).disable();
                        });

                        $('.tooltip').hide();

                        draggingElement = $(this);

                        isDragging = true;

                        oldEventParams = {
                            parent: $(draggingElement).closest('.ScheduleDay')[0],
                            style: $(draggingElement).parents('.EventDetailContainer:first').attr('style')
                        };

                        $(draggingElement).addClass('movedEvent');
                        $(draggingElement).parents('.ScheduleDay:first').addClass(schedule.goblin ? 'OldDropableGoblin' : 'OldDropablePoint');
                        $(draggingElement).parents('.EventDetailContainer:first').css('width', $(draggingElement).parents('.EventDetailContainer:first').css('width'));

                        $(document).on('mousemove', function (event) {

                            if (!isDragging) {
                                document.removeEventListener('mousemove', event);
                                return;
                            }
                            
                            topPositionPrevious = draggingElement.offset().top;
                            leftPositionPrevious = draggingElement.offset().left;
                            const xPositionDifference = event.pageX - draggingElement.offset().left;
                            const yPositionDifference = event.pageY - draggingElement.offset().top;

                            $(draggingElement).parents('.EventDetailContainer:first').offset({
                                top: event.pageY - yPositionDifference,
                                left: event.pageX - xPositionDifference
                            });

                            currentDroppable = $(document.elementFromPoint(event.clientX, event.clientY)).closest('.ScheduleDay');

                            $('.' + (schedule.goblin ? 'DropableGoblin' : 'DropablePoint')).removeClass(schedule.goblin ? 'DropableGoblin' : 'DropablePoint');

                            if (currentDroppable.length > 0) {
                                currentDroppable.addClass(schedule.goblin ? 'DropableGoblin' : 'DropablePoint');
                                currentDroppable.append($(draggingElement).parents('.EventDetailContainer:first').detach());
                            }
                        });
                    }
                }
            });

            $(document).on('mouseup', function (e) {
                switch (e.button) {
                    case 0: {
                        if (!isDragging || draggingElement == undefined || draggingElement == null || oldEventParams == undefined) {
                            return;
                        }

                        isDragging = false;

                        $('.' + (schedule.goblin ? 'OldDropableGoblin' : 'OldDropablePoint')).removeClass((schedule.goblin ? 'OldDropableGoblin' : 'OldDropablePoint'));
                        $('.' + (schedule.goblin ? 'DropableGoblin' : 'DropablePoint')).removeClass(schedule.goblin ? 'DropableGoblin' : 'DropablePoint');
                        $('.movedEvent').removeClass('movedEvent');

                        document.removeEventListener('mousemove', function (e) { });

                        [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (tooltipTriggerEl) {
                            new bootstrap.Tooltip(tooltipTriggerEl).enable();
                        });

                        if (oldEventParams == undefined) {
                            return;
                        }

                        $(eventProgress).parents('.EventDetailContainer:first').attr('style', oldEventParams.style);

                        var eventStart = moment(currEvent.start);
                        var eventEnd = moment(currEvent.end);
                        var prevContainerDate = moment(currEvent.start).startOf('day');
                        var newContainerDate = moment($(eventProgress).parents('.ScheduleDay:first').find('input[name="Date"]').val()).startOf('day');

                        var daysDiff = newContainerDate.diff(prevContainerDate, 'days');
                        var duration = moment.duration(eventEnd.diff(eventStart));

                        // Если нельзя перемещать эвенты в прошлое
                        let newLocId = parseInt($(eventProgress).parents('.ScheduleDay:first').find('input[name="LocationId"]').val());
                        let prevLocId = parseInt($(oldEventParams.parent).find('input[name="LocationId"]').val());
                        if (!schedule.allowMovingEventsToThePast) {
                            let checkDate = eventStart.clone().add(daysDiff, 'days');
                            checkDate = checkDate.clone().add(duration);

                            if (checkDate.isBefore(moment())) {
                                $(draggingElement).parents('.EventDetailContainer:first').offset({
                                    top: topPositionPrevious,
                                    left: leftPositionPrevious
                                });
                                
                                RedrawRow(newLocId);
                                RedrawRow(prevLocId);
                                return
                            }
                        }

                        //Если наложение эвентов запрещено
                        if (!schedule.allowEventsToOverlap) {
                            let eventsInRow = schedule.events.filter(x => x.locationId === newLocId && x.id !== currEvent.id)
                            console.log(eventsInRow);
                            for (let i = 0; i < eventsInRow.length; i++) {
                                const element = eventsInRow[i];
                                console.log('element', element);
                                let temp = eventStart.clone()
                                const eventStartTime = temp.add(daysDiff, 'days');
                                const eventEndTime = eventStartTime.clone().add(duration);
                                const hasIntersection = element.start.isBefore(eventEndTime) && element.end.isAfter(eventStartTime)

                                if (hasIntersection) {
                                    $(draggingElement).parents('.EventDetailContainer:first').offset({
                                        top: topPositionPrevious,
                                        left: leftPositionPrevious
                                    });
    
                                    RedrawRow(newLocId);
                                    RedrawRow(prevLocId);
                                    return
                                }
                            }
                        }

                        // Если эвент перемещаем в неактивную зону
                        if (schedule.inactiveZones) {
                            let zones = schedule.inactiveZones.filter(x => x.locationId == newLocId)
                            if (zones.length > 0) {
                                for (let i = 0; i < zones.length; i++) {
                                    let zone = zones[i]

                                    let temp = eventStart.clone()
                                    const eventStartTime = temp.add(daysDiff, 'days');
                                    const eventEndTime = eventStartTime.clone().add(duration);
                                    const hasIntersection = zone.startTime.isBefore(eventEndTime) && zone.startTime.clone().add(zone.duration, 'day').isAfter(eventStartTime)
                                    
                                    // console.log('intersection');
                                    // console.log(hasIntersection);
                                    // console.log(
                                    //     'zone', 
                                    //     moment(zone.startTime).toDate(), 
                                    //     moment(zone.startTime).clone().add(zone.duration, 'day').toDate()
                                    //     );
                                        
                                    // console.log(
                                    //     'event', 
                                    //     moment(eventStartTime).toDate(), 
                                    //     moment(eventEndTime).toDate()
                                    //     );
                                    // console.log('--------------------');
                                    

                                    if (hasIntersection) {
                                        $(draggingElement).parents('.EventDetailContainer:first').offset({
                                            top: topPositionPrevious,
                                            left: leftPositionPrevious
                                        });
        
                                        RedrawRow(newLocId);
                                        RedrawRow(prevLocId);
                                        return
                                    }
                                }
                            }
                        }

                        currEvent.start = eventStart.add(daysDiff, 'days');
                        currEvent.end = currEvent.start.clone().add(duration);

                        var newLocationId = parseInt($(eventProgress).parents('.ScheduleDay:first').find('input[name="LocationId"]').val());
                        var prevLocationId = parseInt($(oldEventParams.parent).find('input[name="LocationId"]').val());
                        currEvent.locationId = newLocationId;

                        if (schedule.scheduleEvents.onDragEnd) {
                            schedule.scheduleEvents.onDragEnd(currEvent, function () {
                                RedrawRow(newLocationId);
                                RedrawRow(prevLocationId);
                            })
                        }
                        else {
                            RedrawRow(newLocationId);
                            RedrawRow(prevLocationId);
                        }

                        oldEventParams = null;
                    }
                }
            });

            delete eventProgress;
        }

        function RedrawRow(locationId) {
            var $currentRow = $('input[name="LocationId"][value="' + locationId + '"]:first', scheduleContainer).parents('.LocationRow');
            $currentRow.replaceWith(GetLocationRow(locationId));
        }

        function GetScheduleHeader(daysDifference) {

            //Строка шапки
            var eventRowHeader = document.createElement('div');
            eventRowHeader.classList = 'row HeaderRow';

            //Помещение
            var locationDivHeader = document.createElement('div');
            locationDivHeader.classList = 'col-3 GridHeader';
            locationDivHeader.innerText = schedule.title !== null && schedule.title !== undefined ? schedule.title : 'Помещения';
            eventRowHeader.append(locationDivHeader);

            //Id помещения
            var locationInputHeader = document.createElement('input');
            locationInputHeader.type = "hidden";
            locationInputHeader.value = 0;
            locationDivHeader.append(locationInputHeader);

            //Контейнер дат в шапке
            var eventsColumnHeader = document.createElement('div');
            eventsColumnHeader.classList = 'col-9 GridHeader';
            eventRowHeader.append(eventsColumnHeader);

            var headerDate = moment(schedule.start).startOf('day');

            //Отрисовка шапки
            for (var i = 0; i < daysDifference; i++) {
                //Колонка день
                var timeZoneHeader = document.createElement('li');
                timeZoneHeader.classList = 'headerDay text-center';
                let currentDate = moment(headerDate).format('DD.MM.YYYY').toString();
                let array = currentDate.split('.')
                let shortName = MonthInText(array[1], true)
                let longName = MonthInText(array[1], false)
                let isChill = IsChillDay(array[2], array[1], array[0])
                if (isChill) {
                    timeZoneHeader.innerHTML =
                        `<span style="color:red;font-weight:500">${array[0]}</span><br><span style="font-size:12px">${shortName}</span>`
                }
                else {
                    timeZoneHeader.innerHTML =
                        `<span style="font-weight:500">${array[0]}</span><br><span style="font-size:12px">${shortName}</span>`
                }

                timeZoneHeader.title = array[0] + ' ' + longName + ' ' + array[2] + ' г.';
                eventsColumnHeader.append(timeZoneHeader);

                headerDate = moment(headerDate).add('1', 'day');
            }

            return eventRowHeader;
        }

        //Отрисовка контекстного меню(элементы контекста)
        //Возможно как доп параметр надо передавать объект по которому кликнули, для более корректной отрисовки
        function DrawContextMenu(e) {
            $('.daysContextMenu').remove();
            lastContextMenuTarget = e

            // console.log(e)
            // console.log(e.target)
            // console.log(e.target.className)
            // console.log($(e.target).position())
            // console.log($('.todayLine').position())
            
            // клик по дню
            if (e.target.className.indexOf('ScheduleDay') !== -1) {
                let dayBlock = $(e.target)[0]
                let inputDate = $(dayBlock).find('input[name="Date"]').val()
                let mom = moment(inputDate)
                if (moment().startOf('day').isAfter(mom)) {
                    return
                }

                // if ($(e.target).position().left <= $('.todayLine').position().left) {
                //     return
                // }
            }
            // клик по эвенту
            else if (e.target.className.indexOf('EventDetail') !== -1 || e.target.parentElement.className.indexOf('EventDetail') !== -1) {
                if (e.target.className.indexOf('stick') !== -1) {
                    return
                }

                let data = JSON.parse(
                    $(e.target).closest('.EventDetail').data('data')
                )
                let date = moment(data.end)
                if (date.isBefore(moment())) {
                    return
                }
            }


            // if ($(e.target).data('disabled') === 'true') {
            //     return false
            // }
            

            var menuContainer = $('<div>',{
                class: 'list-group daysContextMenu',
            }).css({
                // получаем координаты клика и делаем их координатами меню
                left: e.pageX + 'px',
                top: e.pageY + 'px'
            });

            for (var i = 0; i < dayContextMenu.length; i++) {
                var option = dayContextMenu[i];

                var menuButton = $('<button>', {
                    type: 'button',
                    class: 'list-group-item list-group-item-action',
                    disabled: option.disabled
                }).on('click', option.onClick);

                var menuSpan = $('<span>', {
                    class: 'contextSpan',
                    text: option.text
                });

                menuButton.append(menuSpan);

                if (e.target.parentElement.className.indexOf('DaysContainer') !== -1) {
                    if (option.target === 'both' || option.target === 'timeline') {
                        menuContainer.append(menuButton);
                    }
                }
                else if (e.target.parentElement.className.indexOf('EventDetail') !== -1) {
                    if (option.target === 'both' || option.target === 'event') {
                        menuContainer.append(menuButton);
                    }
                }
            }

            $('body').append(menuContainer);
            return false
        }

        //Добавляем события на основной элемент
        $(scheduleContainer).find('div').each(() => {
            //Удаляем контекстное меню если кликнули мимо
            $(this).on('click', () => {
                $('.daysContextMenu').remove();
            });
            //Удаляем строчку расширения строки если курсор вышел за границы шахматки
            $(this).on('mouseover', () => {
                $('.EmptyRow').remove();
                $('.noBottomBorder').removeClass('noBottomBorder');
            });
        });

        //Добавление нового события на таймлайн
        function AddNewEvent(e) {
            
            let $target = $(lastContextMenuTarget.target).closest('.ScheduleDay');
            let eventId = 0 + (Math.min(...schedule.events.map(event => event.id < 0))) - 1;
            let eventLocationId = $target.find('input[name="LocationId"]').val();

            var eventObj = {
                id: eventId,
                locationId: eventLocationId,
                name: "Событие " + eventId,
                extClass: "",
                start: moment($target.find('input[name="Date"]').val()).startOf('day').hour(schedule.eventDefaultStartTime),
                end: moment($target.find('input[name="Date"]').val()).startOf('day').hour(schedule.eventDefaultStartTime + schedule.eventMinWidth)
            };

            // if (!eventObj.start.isBefore(moment())) {
            //     schedule.events.push(eventObj);
            // }

            // RedrawRow(eventLocationId);

            // schedule.scheduleEvents.onCreateEvent(eventObj);

            let preloader = $('#HGSCH_preloader')
            if (preloader) {
                $(preloader).show()
            }
            
            if (!eventObj.start.isBefore(moment())) {
                if (schedule.scheduleEvents.onCreateEvent) {
                    schedule.scheduleEvents.onCreateEvent(eventObj, function () {
                        RedrawRow(eventLocationId);
                    });
                }
                else {
                    schedule.events.push(eventObj);
                    RedrawRow(eventLocationId);
                }
            }

            return;
        }

        function deleteEvent() {
            let $target = $(lastContextMenuTarget.target).closest('.EventDetail');
            let eventData = JSON.parse($($target).data('data'))
            let eventLocationId = eventData.locationId
            let eventId = eventData.id

            let newEventsArray = schedule.events.filter(item => !(item.locationId === eventLocationId && item.id === eventId))
            schedule.events = newEventsArray
            RedrawRow(eventLocationId);
            schedule.scheduleEvents.onDeleteEvent();
        }

        //Вспомогательные функции для дат в отрисовке шапки
        function MonthInText(str, short) {
            switch (str) {
                case '01': return short === true ? 'ЯНВ' : 'января';
                case '02': return short === true ? 'ФЕВ' : 'февраля';
                case '03': return short === true ? 'МАР' : 'марта';
                case '04': return short === true ? 'АПР' : 'апреля';
                case '05': return short === true ? 'МАЙ' : 'мая';
                case '06': return short === true ? 'ИЮН' : 'июня';
                case '07': return short === true ? 'ИЮЛ' : 'июля';
                case '08': return short === true ? 'АВГ' : 'августа';
                case '09': return short === true ? 'СЕН' : 'сентября';
                case '10': return short === true ? 'ОКТ' : 'октября';
                case '11': return short === true ? 'НОЯ' : 'ноября';
                case '12': return short === true ? 'ДЕК' : 'декабря';
            }
        }

        function IsChillDay(d, m, y) {
            let days = [0, 1, 2, 3, 4, 5, 6];
            let date = new Date(`${d}-${m}-${y}`)
            var n = date.getDay();
            if (days[n] === 0 || days[n] === 6) {
                return true
            }
            return false
        }

        $('.tooltip').hide();

        return scheduleContainer;
    } catch (ex) {
        console.warn(ex);

        Never(schedule.goblin);
    }
}

function Never(goblin) {
    if (goblin == true) {
        var audio = new Audio(); // Создаём новый элемент Audio
        audio.src = './plugins/never/never.mp3'; // Указываем путь к звуку "клика"
        audio.autoplay = true; // Автоматически запускаем
        $('*').addClass('never');
        console.log('never');

        setTimeout(
            () => {
                $('.never').removeClass('never');
            },
            34 * 1000
        );
    }
}