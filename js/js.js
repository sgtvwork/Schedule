//Отрисовывает шахматку и возвращает как html объект
function DrawSchedule(schedule)
{
    console.log('schedule', schedule);

    //При перетаскивании элемента хранит данные о старом месте
    var oldEventParams;
     
    //Главный блок 
    var container = document.createElement('div');
    container.classList = 'p-0 ScheduleContainer';
    $(container).on('contextmenu', function() {return false;});
    var daysDifference = schedule.end.diff(schedule.start, 'days') + 1; 
    
    //Отрисовка шапки
    container.append(GetScheduleHeader(daysDifference));
    
    //Отрисовка помещений и событий
    for(var l = 0; l < schedule.locations.length; l++){
        GetLocationRow(schedule.locations[l].id);
    }

    function GetLocationRow(locationId){            

        var location = schedule.locations.find(x=>x.id == locationId);

        //#region Левая колонка
        //Строка помещения
        var eventRow = document.createElement('div');
        eventRow.classList = 'row LocationRow';
        container.append(eventRow);

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
                    eventProgress.style.zIndex = 1000 - top;
                    eventProgress.setAttribute('data-bs-toggle','tooltip');
                    eventProgress.setAttribute('title', currEvent.name + ' \r\n' + currEvent.start.format('DD.MM.YYYY HH:mm') + ' - ' + currEvent.end.format('DD.MM.YYYY HH:mm'));
                    $(eventProgress).mousedown(
                        (event)=>{
                            DragEvent(event, eventProgress);
                        }
                    );
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
                    eventId.value = JSON.stringify(currEvent);//JSON.parse('{"a":1,"b":2}'); 
                    eventProgress.append(eventId);

                    //Добавляем в отрисованные
                    alreadyPushedEvents.push(currEvent);
                }
            }

            date = moment(date).add('1', 'day');
        }

        //#endregion
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
    
    function DragEvent(event, movedEvent) {
        
        console.log('event', event);
        console.log('movedEvent', movedEvent);

        //var movedEvent = this;
        
        oldEventParams = {
            parent: $(movedEvent).parent('.day'),
            style: $(movedEvent).attr('style')
        };
        console.log('oldEventParams', oldEventParams);

        $(movedEvent).css('width', $(movedEvent).css('width'));
        
        let shiftX = event.clientX - movedEvent.getBoundingClientRect().left;
        let shiftY = event.clientY - movedEvent.getBoundingClientRect().top;

        movedEvent.style.position = 'absolute';
        movedEvent.style.zIndex = 1000;
        document.body.append(movedEvent);

        moveAt(event.pageX, event.pageY);

        // переносит мяч на координаты (pageX, pageY),
        // дополнительно учитывая изначальный сдвиг относительно указателя мыши
        function moveAt(pageX, pageY) {
            movedEvent.style.left = pageX - (shiftX - 5) + 'px';
            movedEvent.style.top = pageY - (shiftY - 5) + 'px';
        }

        let currentDroppable = null;

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);

            movedEvent.hidden = true;
            let elemBelow = document.elementFromPoint(event.clientX, event.clientY);
            movedEvent.hidden = false;

            // событие mousemove может произойти и когда указатель за пределами окна
            // (мяч перетащили за пределы экрана)

            // если clientX/clientY за пределами окна, elementFromPoint вернёт null
            if (!elemBelow) return;

            // потенциальные цели переноса помечены классом droppable (может быть и другая логика)
            let droppableBelow = elemBelow.closest('.day');

            if (currentDroppable != droppableBelow) {
                // мы либо залетаем на цель, либо улетаем из неё
                // внимание: оба значения могут быть null
                //   currentDroppable=null,
                //     если мы были не над droppable до этого события (например, над пустым пространством)
                //   droppableBelow=null,
                //     если мы не над droppable именно сейчас, во время этого события

                if (currentDroppable) {
                // логика обработки процесса "вылета" из droppable (удаляем подсветку)
                    //leaveDroppable(currentDroppable);

                    $(currentDroppable).removeClass('DropablePoint');
                }
                currentDroppable = droppableBelow;
                if (currentDroppable) {
                // логика обработки процесса, когда мы "влетаем" в элемент droppable
                    //enterDroppable(currentDroppable);
                    $(currentDroppable).addClass('DropablePoint');

                }
            }
        }

        // передвигаем мяч при событии mousemove
        document.addEventListener('mousemove', onMouseMove);

        // отпустить мяч, удалить ненужные обработчики
        $(movedEvent).on("mouseup", function() {
            document.removeEventListener('mousemove', onMouseMove);
            movedEvent.onmouseup = null;

            if($(currentDroppable).hasClass('day')){
                $(currentDroppable).append(movedEvent);
                $(movedEvent).attr('style', oldEventParams.style);
                
                
                var eventData = JSON.parse($(movedEvent).children('input[name="EventData"]').val());
                var newLocationId = parseInt($(currentDroppable).children('input[name="LocationId"]').val());

                var daysDiff = moment(moment(eventData.start).startOf('day').diff(moment($(currentDroppable).children('input[name="Date"]').val()))).day();

                var newStartDate = moment($(currentDroppable).children('input[name="Date"]').val())
                                        .hour(moment(eventData.start).hour())
                                        .minute(moment(eventData.start).minute());
                
                var newEndDate = moment(eventData.end)
                                        .add(daysDiff, 'day');;
                
                var eventInList = schedule.events.find(x=>x.id == eventData.id); 
                var oldEventLocationId = eventInList.locationId;
                eventInList.locationId = newLocationId;
                eventInList.start = newStartDate;
                eventInList.end = newEndDate;

                //$('.LocationsContainer input[name="LocationId"][value="' + oldEventLocationId + '"]:first').parents('.LocationRow:first').replaceAll(GetLocationRow(oldEventLocationId));
                //$('.LocationsContainer input[name="LocationId"][value="' + newLocationId + '"]:first').parents('.LocationRow:first').replaceAll(GetLocationRow(newLocationId));
                console.log('new Schedule', schedule);

                $('#container').html(DrawSchedule(schedule));
            }else{
                $(oldEventParams.parent).append(movedEvent);
                $(movedEvent).attr('style', oldEventParams.style);
            }

            $(currentDroppable).removeClass('DropablePoint');
            oldEventParams = null;
        });

        movedEvent.ondragstart = function() {
            return false;
        };
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
    $(container).find('div').each(()=>{
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
    $(container).find('.EventDetailContainer').resizable({
        resizeWidth: true,
        resizeHeight: false,
        onDragStart: null,      // hook into start drag operation (event,$el,opt passed - return false to abort drag)           
        onDragEnd: null,        // hook into stop drag operation (event,$el,opt passed)        
        onDrag: null,           // hook into each drag operation (event,$el,opt passed)
        eventMinWidth: 4        // in hours
    });

    //Включаю все подсказки при наведении
    var tooltipTriggerList = [].slice.call(container.querySelectorAll('[data-bs-toggle="tooltip"]'));
    
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    $('.tooltip').hide();

    return container;
}