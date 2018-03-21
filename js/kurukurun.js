(function ($) {
    $.fn.kurukurun = function (options) {
        var settings = $.extend({
        }, options);

        var ButtonElement = function (top, left, zIndex, width, height) {
            this.top = top;
            this.left = left;
            this.zIndex = zIndex;
            this.width = width;
            this.height = height;
        };

        var Group = function (original, positive, negative) {
            this.original = original;
            this.positive = positive;
            this.negative = negative;
        }

        var elements = {};
        this.children(settings.targetClass).each(function (index, element) {
            var obj = $(element).css(['top', 'left', 'zIndex', 'width', 'height']);
            elements[index] = new ButtonElement(
                obj.top.replace(/[^-\d\.]/g, ''),
                obj.left.replace(/[^-\d\.]/g, ''),
                obj.zIndex,
                obj.width.replace(/[^-\d\.]/g, ''),
                obj.height.replace(/[^-\d\.]/g, '')
            );
        });
        var elementsLength = Object.keys(elements).length;
        // console.log(elementsLength);

        var groups = {};
        for (var i = 0; i < elementsLength; i++) {
            var positiveElementsIndex = i == elementsLength - 1 ? 0 : i + 1;
            var negativeElementsIndex = i == 0 ? elementsLength - 1 : i - 1;
            groups[i] = new Group(elements[i], elements[positiveElementsIndex], elements[negativeElementsIndex]);
        }
        var groupsLength = Object.keys(groups).length;

        // タッチイベントが利用可能かの判別
        var supportTouch = 'ontouchend' in document;
        var EVENTNAME_TOUCHSTART = supportTouch ? 'touchstart' : 'mousedown';
        var EVENTNAME_TOUCHMOVE = supportTouch ? 'touchmove' : 'mousemove';
        var EVENTNAME_TOUCHEND = supportTouch ? 'touchend' : 'mouseup';

        var startX = 0;
        var normalize;
        var onTouchStart = function (event) {
            startX = getHorizontalPosition(event);
        };

        var onTouchMove = function (event) {
            var endX = getHorizontalPosition(event);
            var duration = endX - startX;
            normalize = normalized(0, 220, duration);

            if (0 < normalize) {
                while (1 < normalize) {
                    replaceGroup(true);
                    normalize -= 1;
                    startX = endX;
                }
                for (var i = 0; i < groupsLength; i++) {
                    translate(settings.idPrefix + i, groups[i].original, groups[i].positive, normalize);
                }
            } else if (normalize < 0) {
                while (normalize < -1) {
                    replaceGroup(false);
                    normalize += 1;
                    startX = endX;
                }
                for (var i = 0; i < groupsLength; i++) {
                    translate(settings.idPrefix + i, groups[i].original, groups[i].negative, normalize);
                }
            }
        };

        var onTouchEnd = function (event) {
            replaceGroup(normalize > 0);
            for (var i = 0; i < groupsLength; i++) {
                var top = groups[i].original.top;
                var left = groups[i].original.left;
                var width = groups[i].original.width;
                var height = groups[i].original.height;
                $(settings.idPrefix + i).animate({ top: top, left: left, width: width, height: height });
            }
        };

        //横方向の座標を取得
        var getHorizontalPosition = function (event) {
            var x;
            if (supportTouch) {
                x = event.originalEvent.changedTouches[0].pageX;
            } else {
                x = event.pageX;
            }
            return x;
        };

        var normalized = function (min, max, value) {
            var sum = min + max;
            return sum != 0 ? value / sum : 0;
        };

        var translate = function (targetClassName, originalElement, targetElement, normalizedDuration) {
            var top = lerp(originalElement.top, targetElement.top, normalizedDuration);
            var left = lerp(originalElement.left, targetElement.left, normalizedDuration);
            var width = lerp(originalElement.width, targetElement.width, normalizedDuration);
            var height = lerp(originalElement.height, targetElement.height, normalizedDuration);
            $(targetClassName).css({
                top: top,
                left: left,
                width: width,
                height: height
            });
        };

        var replaceGroup = function (isPositive) {
            if (isPositive) {
                var tmp = new Group(groups[0].original, groups[0].positive, groups[0].negative);
                for (var i = 0; i < groupsLength; i++) {
                    groups[i] = i == groupsLength - 1 ? tmp : groups[i + 1];
                }
            }
            else {
                var tmp = new Group(groups[groupsLength - 1].original, groups[groupsLength - 1].positive, groups[groupsLength - 1].negative);
                for (var i = groupsLength - 1; 0 <= i; i--) {
                    groups[i] = i == 0 ? tmp : groups[i - 1];
                }
            }
        };

        // http://uchinoinu.hatenablog.jp/entry/2016/12/21/164118
        var lerp = function (a, b, t) {
            t = Math.abs(t);
            return (1 - t) * a + t * b
        };

        this.on(EVENTNAME_TOUCHSTART, onTouchStart);
        this.on(EVENTNAME_TOUCHMOVE, onTouchMove);
        this.on(EVENTNAME_TOUCHEND, onTouchEnd);
    };
})(jQuery);
