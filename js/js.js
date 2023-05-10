//Отрисовывает шахматку и возвращает как html объект
function DrawSchedule(schedule)
{
    console.log('schedule', schedule);

    //Контекстное меню (Пока не помещал в общий объект, существует как глобальная переменная)
    var dayContextMenu
    var contextMenuExists = false
    if (schedule.contextMenu === 'default') {
        dayContextMenu = [
            {
                text: "Создать",
                disabled: false,
                lClick: function(){ 
                    console.log('Context button', "Создать", this);
                }
            },
            {
                text: "Переместить",
                disabled: true,
                lClick: function(){ console.log('Context button', "Переместить");}
            },
            {
                text: "Редактировать",
                disabled: true,
                lClick: function(){ console.log('Context button', "Редактировать");}
            },
            {
                text: "Удалить",
                disabled: false,
                lClick: function(){ console.log('Context button', "Удалить");}
            }
        ];
    }
    else if (schedule.contextMenu) {
        dayContextMenu = schedule.contextMenu
    }    
    else {
        dayContextMenu = null
    }

    //При перетаскивании элемента хранит данные о старом месте    
    var movedEventDuplicate;
     
    //Главный блок 
    var scheduleContainer = document.createElement('div');
    scheduleContainer.classList = 'p-0 ScheduleContainer';
    $(scheduleContainer).on('contextmenu', function() {return false;});
    var daysDifference = moment(schedule.end).startOf('day').diff(moment(schedule.start).startOf('day'), 'days') + 1; 
    
    //Отрисовка шапки
    scheduleContainer.append(GetScheduleHeader(daysDifference));
    
    //Отрисовка помещений и событий
    for(var l = 0; l < schedule.locations.length; l++){
        scheduleContainer.append(GetLocationRow(schedule.locations[l].id));
    }

    function GetLocationRow(locationId){

        var location = schedule.locations.find(x=>x.id == locationId);

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
        var locationInput= document.createElement('input');            
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
        for(var i = 0; i < daysDifference; i++){
            
            //Колонка день
            var timeZone = document.createElement('li');
            timeZone.classList = 'ScheduleDay';    
            timeZone.setAttribute('childnumber', i+1)        
            // timeZone.addEventListener('click', schedule.scheduleEvents.lClick);
            timeZone.addEventListener('click', addNewEvent);
            // timeZone.addEventListener('contextmenu', schedule.scheduleEvents.rClick);  
            if (schedule.contextMenu) {
                timeZone.addEventListener('contextmenu', DrawContextMenu);
            }          
            
            timeZone.style = 'min-height: 3.2rem;';
            movedEventDuplicate
            eventsColumn.append(timeZone);
            
            var dateInfo = document.createElement('input');
            dateInfo.type = 'hidden';
            dateInfo.name = 'Date';
            dateInfo.value = moment(date).format('YYYY-MM-DDTHH:mm:SS.000Z'),
            timeZone.append(dateInfo);

            var locationInfo = document.createElement('input');
            locationInfo.type = 'hidden';
            locationInfo.name = 'LocationId';
            locationInfo.value = location.id ;
            timeZone.append(locationInfo);

            //Получаем список событий начинающийся в этот день
            var events = schedule.events.filter(
                x => x.locationId == location.id 
                && x.start >= moment(date).startOf('day')
                && x.start <= moment(date).endOf('day')
            );

            //Получаем список событий начинающийся в этот день и ранее (если начало выходит за диапазон отрисовки)
            if(i == 0){
                events = schedule.events.filter(
                    x=>x.locationId == location.id 
                    && x.start <= moment(date).endOf('day')
                ).sort(x=>x.start);
            }
            
            //Отрисовка мероприятий в этот день
            if(events.length > 0){
                for(var e = 0; e < events.length; e++){
                    
                    var currEvent = events[e];

                    //Отступ сверху
                    var top = alreadyPushedEvents.filter(x=>x.locationId == currEvent.locationId && x.start < currEvent.end && x.end > currEvent.start).length;

                    //Контейнер детали мероприятия (полоска)
                    var eventProgressContainer = document.createElement('div');
                    eventProgressContainer.classList = 'EventDetailContainer ' + currEvent.extClass;
                    
                    //Контейнер детали мероприятия (полоска)
                    var eventProgress = document.createElement('div');
                    eventProgress.classList = 'EventDetail ' + currEvent.extClass;
                    eventProgress.setAttribute('data-bs-toggle','tooltip');
                    eventProgress.setAttribute('title', currEvent.name + ' \r\n' + currEvent.start.format('DD.MM.YYYY HH:mm') + ' - ' + currEvent.end.format('DD.MM.YYYY HH:mm'));
                   
                    eventProgressContainer.append(eventProgress);
                    
                    //Расчет длины события (не лезь сюда, оно тебя сожрет) 
                    if(currEvent.start >= schedule.start && currEvent.end <= schedule.end)
                    {
                        eventProgressContainer.style.width = (currEvent.end.diff(currEvent.start, 'day', true) * 100) + '%';
                        eventProgressContainer.style.left = (currEvent.start.diff(moment(date), 'day', true) * 100) + '%';
                    }
                    else if(currEvent.start < schedule.start && currEvent.end > schedule.end)
                    {
                        eventProgressContainer.style.width = (schedule.end.diff(schedule.start.startOf('day'), 'day', true) * 100) + '%';
                        eventProgressContainer.style.left = '0%';
                    }
                    else if(currEvent.start >= schedule.start )
                    {
                        eventProgressContainer.style.width = (schedule.end.diff(currEvent.start, 'day', true) * 100) + '%';
                        eventProgressContainer.style.left = (currEvent.start.diff(moment(date), 'day', true) * 100) + '%';
                    }
                    else
                    {
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
                    
                    //Data мероприятия
                    var eventId = document.createElement('input');
                    eventId.type = 'hidden';
                    eventId.name = 'EventData';
                    eventId.value = JSON.stringify(currEvent);
                    eventProgress.append(eventId);

                    //Добавляем в отрисованные
                    alreadyPushedEvents.push(currEvent);

                    //#region drag events
                    
                    addEventListners(eventProgress, currEvent);

                    
                    //#endregion drag events

                }
            }

            date = moment(date).startOf('day').add('1', 'day');
        }
        
        //Включение ресайза
        $(eventRow).find('.EventDetailContainer').resizableSafe({
            resizeWidth: true,
            resizeHeight: false,
            onDragStart: schedule.scheduleEvents.onResizeStart !== null ? schedule.scheduleEvents.onResizeStart : null,       // hook into start drag operation (event,$el,opt passed - return false to abort drag)           
            onDragEnd: null,        // hook into stop drag operation (event,$el,opt passed)        
            onDrag: schedule.scheduleEvents.onResize !== null ? schedule.scheduleEvents.onResize : null,           // hook into each drag operation (event,$el,opt passed)
            eventMinWidth: 4,        // in hours
            redrawFunc: function (locationId, data) {
                console.log('fijsffhk',data)

                var event = schedule.events.find(x => x.id === data.eventId);
                event.start = data.startDate;
                event.end = data.endDate;
                console.log(schedule)
                // const index = schedule.events.findIndex(x => x.id === data.eventId)
                // if (index !== -1) {
                //     const newElem = { 
                //         ...schedule.events[index],
                //         end: data.endDate,
                //         start: data.startDate
                //     }
                //     schedule.events[index] = newElem
                // }
                RedrawRow(locationId)
            }
        });

        return eventRow;

        //#endregion
    }

    function addEventListners(eventProgress, currEvent){
               
        var oldEventParams;
        var currentDroppable;
        var isDragging = false;
        var draggingElement;

        $(eventProgress).off('mousedown').on('mousedown', function(e){ 
            
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
            $(draggingElement).parents('.ScheduleDay:first').addClass('OldDropablePoint');
            $(draggingElement).parents('.EventDetailContainer:first').css('width', $(draggingElement).parents('.EventDetailContainer:first').css('width'));
            
            $(document).on('mousemove', function(event) {
                
                if(!isDragging){
                    document.removeEventListener('mousemove', event);
                    return;
                }

                const xPositionDifference = event.pageX - draggingElement.offset().left;
                const yPositionDifference = event.pageY - draggingElement.offset().top;
                
                $(draggingElement).parents('.EventDetailContainer:first').offset({
                    top: event.pageY - yPositionDifference,
                    left: event.pageX - xPositionDifference
                });
                
                currentDroppable = $(document.elementFromPoint(event.clientX, event.clientY)).closest('.ScheduleDay');

                //currEvent.locationId = $(currentDroppable).find('input[name="LocationId"]').val();
                console.log('currEvent.locationId', currEvent.locationId, $(currentDroppable).find('input[name="LocationId"]').val())
                $('.DropablePoint').removeClass('DropablePoint');
                
                if (currentDroppable.length > 0) {
                    currentDroppable.addClass('DropablePoint');
                    currentDroppable.append($(draggingElement).parents('.EventDetailContainer:first').detach());
                }
            });
        }); 

        $(document).on('mouseup',function(e){ 
            
            if(!isDragging || draggingElement == undefined || draggingElement == null || oldEventParams == undefined){
                return;
            }

            isDragging = false;
            
            $('.OldDropablePoint').removeClass('OldDropablePoint');
            $('.DropablePoint').removeClass('DropablePoint');
            $('.movedEvent').removeClass('movedEvent');

            document.removeEventListener('mousemove',function(e){}); 

            [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (tooltipTriggerEl) {
                new bootstrap.Tooltip(tooltipTriggerEl).enable();
            });

            if(oldEventParams == undefined){
                return;
            }

            $(eventProgress).parents('.EventDetailContainer:first').attr('style', oldEventParams.style);
            
            var eventStart = moment(currEvent.start);
            var eventEnd = moment(currEvent.end);
            var prevContainerDate = moment(currEvent.start).startOf('day');
            var newContainerDate = moment($(eventProgress).parents('.ScheduleDay:first').find('input[name="Date"]').val()).startOf('day');

            var daysDiff = newContainerDate.diff(prevContainerDate, 'days');
            var duration = moment.duration(eventEnd.diff(eventStart));

            currEvent.start = eventStart.add(daysDiff, 'days');
            currEvent.end = currEvent.start.clone().add(duration);

            var newLocationId = parseInt($(eventProgress).parents('.ScheduleDay:first').find('input[name="LocationId"]').val());
            var prevLocationId = parseInt($(oldEventParams.parent).find('input[name="LocationId"]').val());
            currEvent.locationId = newLocationId;

            console.log('oldEventParams', oldEventParams)
            console.log('prevLocationId', prevLocationId, 'newLocationId', newLocationId)
            console.log('currEvent.locationId', currEvent)
            
            RedrawRow(newLocationId);
            RedrawRow(prevLocationId);

            oldEventParams = null;
            console.log('mouseup end');

        });

        delete eventProgress;
    }

    function RedrawRow(locationId){
        var $currentRow = $('input[name="LocationId"][value="' + locationId + '"]:first', scheduleContainer).parents('.LocationRow');
        $currentRow.replaceWith(GetLocationRow(locationId));
        // schedule.scheduleEvents.drawEnd();
    }

    function GetScheduleHeader(daysDifference){

        //Строка шапки
        var eventRowHeader = document.createElement('div');
        eventRowHeader.classList = 'row LocationRow';

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
        for(var i = 0; i < daysDifference; i++){
            //Колонка день
            var timeZoneHeader = document.createElement('li');
            timeZoneHeader.classList = 'headerDay text-center';
            let currentDate = moment(headerDate).format('DD.MM.YYYY').toString();
            let array = currentDate.split('.')
            let shortName = monthInText(array[1], true)
            let longName = monthInText(array[1], false)
            let isChill = isChillDay(array[2], array[1], array[0])
            if (isChill) {
                timeZoneHeader.innerHTML = 
                    `<span style="color:red;font-weight:500">${array[0]}</span><br><span style="font-size:12px">${shortName}</span>`            
            }
            else {
                timeZoneHeader.innerHTML = 
                    `<span style="font-weight:500">${array[0]}</span><br><span style="font-size:12px">${shortName}</span>`        
            }

            timeZoneHeader.title = array[0] + ' ' + longName + ' ' + array[2] + ' г.'
            // timeZoneHeader.innerText = moment(headerDate).format('DD.MM.YYYY');
            eventsColumnHeader.append(timeZoneHeader);

            headerDate = moment(headerDate).add('1', 'day');
        }

        return eventRowHeader;
    }
    
    //Отрисовка контекстного меню(элементы контекста)
    //Возможно как доп параметр надо передавать объект по которому кликнули, для более корректной отрисовки
    function DrawContextMenu(){

        $('.daysContextMenu').remove();
        contextMenuExists = false

        var menuContainer = $('<div>',{
            class: 'list-group daysContextMenu',
        }).css({
            // получаем координаты клика и делаем их координатами меню
            left: event.pageX+'px', 
            top: event.pageY+'px' 
        });

        for(var i = 0; i < dayContextMenu.length; i++){
            var option = dayContextMenu[i];

            var menuButton = $('<button>',{
                type: 'button',
                class: 'list-group-item list-group-item-action',
                disabled: option.disabled
            }).on('click', option.lClick);

            menuContainer.append(menuButton);

            var menuSpan = $('<span>',{
                class: 'contextSpan',
                text: option.text
            });

            menuButton.append(menuSpan);
        }

        $('body').append(menuContainer);
        contextMenuExists = true
        return false
    }

    //Добавляем события на основной элемент
    $(scheduleContainer).find('div').each(()=>{
        //Удаляем контекстное меню если кликнули мимо
        $(this).on('click',()=>{
            $('.daysContextMenu').remove();
            contextMenuExists = false
        });
        //Удаляем строчку расширения строки если курсор вышел за границы шахматки
        $(this).on('mouseover',()=>{
            $('.EmptyRow').remove();
            $('.noBottomBorder').removeClass('noBottomBorder');
        });
    });

    //Добавление нового события на таймлайн
    function addNewEvent(e) {
        if (e.target.className === 'ScheduleDay') {
            if (!contextMenuExists) {
                let $target = $(e.target).closest('.ScheduleDay');
                let eventId = Math.max(...schedule.events.map(event => event.id)) + 1;
                let eventLocationId = $target.find('input[name="LocationId"]').val();
                
                var eventObj = {
                    id: eventId,
                    locationId: eventLocationId,
                    name: "Событие " + eventId,
                    extClass: "",
                    start: moment($target.find('input[name="Date"]').val()).startOf('day').hour(9),
                    end: moment($target.find('input[name="Date"]').val()).startOf('day').hour(18)
                };
                
                schedule.events.push(eventObj);
                
                RedrawRow(eventLocationId);

                schedule.scheduleEvents.onCreateEvent(eventObj);
                
                return;

                //let width = 50;
                //let ghostEvent = createEventDiv(e, width);
                // $(target).append(ghostEvent)
                // console.log('event created')
                
                // //пока отключил
                // //$(document).on('mousemove', rendering)
                // //$(document).on('mouseup', renderStop)

                // function rendering(e){        
                //     console.log('rendering')
                //     let wdth = $(ghostEvent).width()
                //     $(ghostEvent).css('width', wdth + 1 + 'px')
                // }
                // function renderStop(e){
                //     console.log('render stop')
                //     e.stopPropagation();
                //     e.preventDefault();
                //     $(document).off('mousemove', rendering);
                //     $(document).off('mouseup', renderStop);
                // }
            }            
        }        
    }

    //Получение диапазона дат для нового события
    function getEventDates(event, target, startEventWidth){
        
        let dateStart = new Date( $(target).find('input[name="Date"]').val() ).toLocaleDateString()
        let dateArr = dateStart.split('.')

        let minutesInPixel = startEventWidth * 24 * 60 / $('.ScheduleDay').width()
        minutesInPixel = Math.trunc(minutesInPixel)
        
        let w = Number ($(event).css('left').replace('px', '') )
        let dw = $('.ScheduleDay').width()
        let prc = w * 100 / dw
        let time = 24 * 60 * prc / 100
        let hrs = Math.trunc(time / 60)
        hrs = hrs.toString().length === 2 ? hrs : '0' + hrs
        let mins = Math.trunc( Number(time) % 60 )
        mins = mins.toString().length === 2 ? mins : '0' + mins

        let stringResult = ''
        let finalStartDate = new Date(`${dateArr[1]} ${dateArr[0]} ${dateArr[2]} ${hrs}:${mins}:00`)
        stringResult += finalStartDate.toLocaleString().replace(',', '').slice(0,-3)
        let finalEndDate = new Date(finalStartDate.setMinutes(finalStartDate.getMinutes() + Math.trunc(minutesInPixel) ))
        stringResult += ' - '
        stringResult += finalEndDate.toLocaleString().replace(',', '').slice(0,-3)
        
        return stringResult
    }

    //Вспомогательные функции для дат в отрисовке шапки
    function monthInText(str, short) {
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

    function isChillDay(d, m, y) {
        let days = [0, 1, 2, 3, 4, 5, 6];
        let date = new Date(`${d}-${m}-${y}`)
        var n = date.getDay();
        if (days[n] === 0 || days[n] === 6) {
            return true
        }
        return false
    }

    //Включаю все подсказки при наведении
    var tooltipTriggerList = [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]'));
    
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    $('.tooltip').hide();

    return scheduleContainer;
}