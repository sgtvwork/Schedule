//Отрисовывает шахматку и возвращает как html объект
function DrawSchedule(schedule)
{
    console.log('schedule', schedule);

    //При перетаскивании элемента хранит данные о старом месте
    
    var movedEventDuplicate;
     
    //Главный блок 
    var scheduleContainer = document.createElement('div');
    scheduleContainer.classList = 'p-0 ScheduleContainer';
    $(scheduleContainer).on('contextmenu', function() {return false;});
    var daysDifference = schedule.end.diff(schedule.start, 'days') + 1; 
    
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
        locationDiv.innerText = location.name;
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

        var date = moment(schedule.start);

        //Уже отрисованные элементы в этой строке (нужен для определения отступа сверху)
        var alreadyPushedEvents = [];

        //Цикл отрисовки сетки дней
        for(var i = 0; i < daysDifference; i++){
            //Колонка день
            var timeZone = document.createElement('li');
            timeZone.classList = 'day';    
            timeZone.setAttribute('childnumber', i+1)        
            timeZone.addEventListener('click', schedule.scheduleEvents.lClick);
            timeZone.addEventListener('contextmenu', schedule.scheduleEvents.rClick);
            timeZone.style = 'min-height: 3.2rem;';
            movedEventDuplicate
            eventsColumn.append(timeZone);
            
            var dateInfo = document.createElement('input');
            dateInfo.type = 'hidden';
            dateInfo.name = 'Date';
            dateInfo.value = date.toISOString();
            timeZone.append(dateInfo);

            var locationInfo = document.createElement('input');
            locationInfo.type = 'hidden';
            locationInfo.name = 'LocationId';
            locationInfo.value = location.id ;
            timeZone.append(locationInfo);

            //Получаем список событий начинающийся в этот день
            var events = schedule.events.filter(
                x => x.locationId == location.id 
                && x.start >= date.startOf('day')
                && x.start <= date.endOf('day')
            );

            //Получаем список событий начинающийся в этот день и ранее (если начало выходит за диапазон отрисовки)
            if(i == 0){
                events = schedule.events.filter(
                    x=>x.locationId == location.id 
                    && x.start <= date.endOf('day')
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
                        eventProgressContainer.style.left = (currEvent.start.diff(date.startOf('day'), 'day', true) * 100) + '%';
                    }
                    else if(currEvent.start < schedule.start && currEvent.end > schedule.end)
                    {
                        eventProgressContainer.style.width = (schedule.end.diff(schedule.start.startOf('day'), 'day', true) * 100) + '%';
                        eventProgressContainer.style.left = '0%';
                    }
                    else if(currEvent.start >= schedule.start )
                    {
                        eventProgressContainer.style.width = (schedule.end.diff(currEvent.start, 'day', true) * 100) + '%';
                        eventProgressContainer.style.left = (currEvent.start.diff(date.startOf('day'), 'day', true) * 100) + '%';
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
                    eventName.innerText = currEvent.name;
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
                    
                    var oldEventParams;
                    var currentDroppable;
                    var isDragging = false;
                    
                    eventProgress.addEventListener('mousedown', function(e){ 
                        
                        [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]')).map(function (tooltipTriggerEl) {
                            new bootstrap.Tooltip(tooltipTriggerEl).disable();
                        });
                        $('.tooltip').hide();

                        
                        var draggingElement = $(this);
                        
                        isDragging = true; 
                        
                        oldEventParams = {
                            parent: $(draggingElement).parents('.day:first'),
                            style: $(draggingElement).parents('.EventDetailContainer:first').attr('style')
                        };
                        console.log('oldEventParams', oldEventParams);
                        $(draggingElement).addClass('movedEvent');
                        $(draggingElement).parents('.day:first').addClass('OldDropablePoint');
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
                            
                            currentDroppable = $(document.elementFromPoint(event.clientX, event.clientY)).closest('.day');
                                                    
                            $('.DropablePoint').removeClass('DropablePoint');
                            
                            if (currentDroppable.length > 0) {
                                currentDroppable.addClass('DropablePoint');
                                currentDroppable.append($(draggingElement).parents('.EventDetailContainer:first'));
                            }
                        });
                    }); 

                    $(document).on('mouseup',function(e){ 
                        var draggingElement = $(this);

                        if(draggingElement == undefined){
                            return;
                        }
                        console.log('2 oldEventParams', oldEventParams);
                        
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
                            
                        // var prevDate = moment(currEvent.start).startOf('day');
                        // var newDate = moment($(oldEventParams.parent).find('input[name="Date"]').val()).startOf('day');
                        // var daysDiff = 0;

                        // const start = moment(startDate);
                        // const end = moment(endDate);
                        // const newStart = moment(newStartDate);
                        // const newEnd = moment(newEndDate);
                        
                        // // Вычисляем разницу между текущими датами и промежутком
                        // const diff = end.diff(start, 'hours');
                        
                        // // Смещаем новые даты на ту же разницу
                        // const newDiff = newEnd.diff(newStart, 'hours');
                        // const offset = newDiff - diff;
                        // newStart.add(offset, 'hours');
                        // newEnd.add(offset, 'hours');







                        // if(prevDate >= newDate){
                        //     daysDiff = moment(prevDate).daysDiff(newDate, 'days');
                        // }else{
                        //     daysDiff = moment(newDate).daysDiff(prevDate, 'days');
                        // }
                        // console.log('prevDate', prevDate, 'newDate', newDate, 'daysDiff', daysDiff);

                        var newLocationId = parseInt($(eventProgress).parents('.day:first').find('input[name="LocationId"]').val());
                        var prevLocationId = parseInt($(oldEventParams.parent).find('input[name="LocationId"]').val());
                        console.log('newLocationId', newLocationId, 'prevLocationId', prevLocationId);
                        currEvent.locationId = newLocationId;

                        RedrawRow(prevLocationId);
                        RedrawRow(newLocationId);
                    });

                    //#endregion drag events

                }
            }

            date = moment(date).add('1', 'day');
        }
        
        return eventRow;

        //#endregion
    }

    function RedrawRow(locationId){
        var $currentRow = $('input[name="LocationId"][value="' + locationId + '"]:first', scheduleContainer).parents('.LocationRow');
        $currentRow.replaceWith(GetLocationRow(locationId));
    }

    function GetScheduleHeader(daysDifference){

        //Строка шапки
        var eventRowHeader = document.createElement('div');
        eventRowHeader.classList = 'row LocationRow';

        //Помещение
        var locationDivHeader = document.createElement('div');
        locationDivHeader.classList = 'col-3 GridHeader';
        locationDivHeader.innerText = 'Помещения';
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

        var headerDate = schedule.start;

        //Отрисовка шапки
        for(var i = 0; i < daysDifference; i++){
            //Колонка день
            var timeZoneHeader = document.createElement('li');
            timeZoneHeader.classList = 'headerDay text-center';
            timeZoneHeader.innerText = moment(headerDate).format('DD.MM.YYYY');
            eventsColumnHeader.append(timeZoneHeader);

            headerDate = moment(headerDate).add('1', 'day');
        }

        return eventRowHeader;
    }
    

    //Отрисовка контекстного меню(элементы контекста)
    //Возможно как доп параметр надо передавать объект по которому кликнули, для более корректной отрисовки
    function DrawContextMenu(contextContent){

        $('.daysContextMenu').remove();

        var menuContainer = $('<div>',{
            class: 'list-group daysContextMenu',
        }).css({
            // получаем координаты клика и делаем их координатами меню
            left: event.pageX+'px', 
            top: event.pageY+'px' 
        });

        for(var i = 0; i < contextContent.length; i++){
            var option = contextContent[i];

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
    }

    //Добавляем события на основной элемент
    $(scheduleContainer).find('div').each(()=>{
        //Удаляем контекстное меню если кликнули мимо
        $(this).on('click',()=>{
            $('.daysContextMenu').remove();
        });
        //Удаляем строчку расширения строки если курсор вышел за границы шахматки
        $(this).on('mouseover',()=>{
            $('.EmptyRow').remove();
            $('.noBottomBorder').removeClass('noBottomBorder');
        });
    });

    //Включение ресайза после отрисовки
    $(scheduleContainer).find('.EventDetailContainer').resizable({
        resizeWidth: true,
        resizeHeight: false,
        onDragStart: null,      // hook into start drag operation (event,$el,opt passed - return false to abort drag)           
        onDragEnd: null,        // hook into stop drag operation (event,$el,opt passed)        
        onDrag: null,           // hook into each drag operation (event,$el,opt passed)
        eventMinWidth: 4        // in hours
    });

    //Включаю все подсказки при наведении
    var tooltipTriggerList = [].slice.call(scheduleContainer.querySelectorAll('[data-bs-toggle="tooltip"]'));
    
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    $('.tooltip').hide();

    return scheduleContainer;
}