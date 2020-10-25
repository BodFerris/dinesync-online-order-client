import { hPlacement, vPlacement, IPoint } from './point-interface';
import { StringUtility } from './string-utility';

export class HtmlUtility {
    private static _animationEndEventName: string = <any>null;

    static getQueryParams(url: string): {[key: string]: string } {
        let returnValue: {[key: string]: string } = {};

        //let parsingRegEx = /[\?&](?<key>[^&=]+)=(?<value>[^&=]+)/g
        // dumbing down the regex to support older browsers
        let parsingRegEx = /[\?&]([^&=]+)=([^&=]+)/g

        let match = parsingRegEx.exec(url);
        while (match) {
            returnValue[match[1]] = match[2];
            match = parsingRegEx.exec(url);
        }

        return returnValue;
    }

    public static getAnimationEndEventPropertyName(): string {
        if (!HtmlUtility._animationEndEventName) {
            HtmlUtility._animationEndEventName = 'animationend';

            let styles = window.getComputedStyle(document.documentElement, '');
            if ('webkitAnimation' in styles) {
                HtmlUtility._animationEndEventName = 'webkitAnimationEnd'
            }

            if ('WebkitAnimation' in styles) {
                HtmlUtility._animationEndEventName = 'webkitAnimationEnd'
            }

            if ('animation' in styles) {
                HtmlUtility._animationEndEventName = 'animationend'
            }
        }

        return HtmlUtility._animationEndEventName;
    }

    // needed for Internet Explorer (even for version 11)
    public static createNewEvent(eventName: string, data: any): CustomEvent {
        let event = null;
        if (typeof (CustomEvent) === 'function') {
            event = new CustomEvent(eventName, { detail: data });
        }
        else {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(eventName, true, true, data);
        }

        return event;
    }

    public static attachOneTime(element: Element, eventName: string, handler: (eventArgs?: any) => void): void {
        var oneTimeEventHandler = (eventArgs: any) => {
            handler(eventArgs);

            element.removeEventListener(eventName, oneTimeEventHandler);
            handler = <any>null;
            oneTimeEventHandler = <any>null;
        }

        element.addEventListener(eventName, oneTimeEventHandler);
    }

    // Helper for animate.css library
    public static animateCss(element: HTMLElement, animationClassName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let animationEndHandler = (eventArgs: AnimationEvent) => {
                if (!element) {
                    // the html element has been removed from the DOM
                    if (resolve) {
                        resolve('');
                    }
                }
                else if ((eventArgs.animationName === animationClassName) && (eventArgs.currentTarget === element)) {
                    element.classList.remove(animationClassName);
                    element.classList.remove('animated');

                    if (resolve) {
                        resolve(element.id);
                    }

                    // cleanup
                    element.removeEventListener(HtmlUtility.getAnimationEndEventPropertyName(), <any>animationEndHandler);
                    element = <any>null;
                    animationEndHandler = <any>null;
                }
            };

            element.addEventListener(HtmlUtility.getAnimationEndEventPropertyName(), <any>animationEndHandler);
            element.classList.add(animationClassName);
            element.classList.add('animated');
        });
    }

    public static showProgressBar(element: HTMLElement, animatingElementClassName: string, isVisiblityToggled: boolean) {
        if (isVisiblityToggled) {
            element.style.visibility = 'visible';
        }

        (<HTMLElement>element.querySelector('.' + animatingElementClassName)).style.animationPlayState = 'running';
    }

    public static hideProgressBar(element: HTMLElement, animatingElementClassName: string, isVisiblityToggled: boolean) {
        if (isVisiblityToggled) {
            element.style.visibility = 'hidden';
        }

        (<HTMLElement>element.querySelector('.' + animatingElementClassName)).style.animationPlayState = 'paused';
    }

    // Chrome has an outlien that shows when a button (or any focusable element)
    // gets focused. While this is ideal when tabbing via the keybaord, it's not
    // ideal when a button is clicked via the mouse or touch.
    //
    // This remvoes the outline if clicked, and restroes the outline when
    // the element loses focus.
    public static removeChromeOutlineOnClick(element: HTMLElement) {
        element.style.outlineWidth = '0';
        HtmlUtility.attachOneTime(element, 'blur', () => {
            if (element) {
                element.style.outlineWidth = 'initial';
            }
        });
    }

    // traverses up the DOM to return an element having the specified class name
    public static getContainer(containerClassName: string, child: HTMLElement): HTMLElement {
        var returnValue: HTMLElement = <any>null;
        if (child.classList.contains(containerClassName)) {
            return child;
        }

        var element = child.parentElement;
        while (element && !element.classList.contains(containerClassName)) {
            element = element.parentElement;
        }

        if (element && element.classList.contains(containerClassName)) {
            returnValue = element;
        }

        return returnValue;
    }

    // uses screen coordinates to determine if a point is within an element bounds;
    // x and y are in SCREEN cooridinates
    public static isPointInElementBounds(x: number, y: number, element: HTMLElement) {
        let boundRect = element.getBoundingClientRect();

        if (((x < boundRect.left) || (x > (boundRect.left + boundRect.width)))
            ||
            ((y < boundRect.top) || (y > (boundRect.top + boundRect.height)))) {
            return false;
        }
        else {
            return true;
        }
    }

    public static isRectWithinScreen(x: number, y: number, width: number, height: number): boolean {
        let viewportWdith = document.documentElement.clientWidth;
        let viewportHeight = document.documentElement.clientHeight;

        if ((x + width) > viewportWdith) {
            return false;
        }

        if (x < 0) {
            return false;
        }

        if ((y + height) > viewportHeight) {
            return false;
        }

        if (y < 0) {
            return false;
        }

        return true;
    }

    // element and achorElement must already be attached to the DOM
    // TODO: Make it more advanced, by returning reasons why it failed,
    // which is why the return value is setup to return mutlple values intead of one
    public static getVerticalPlacement(
        element: HTMLElement, 
        anchorElement: HTMLElement, 
        paddingPx: number, 
        preference: 'top' | 'bottom'): { point: IPoint } {

        let elementRect = element.getBoundingClientRect();
        let anchorRect = anchorElement.getBoundingClientRect();
        let returnValue = { point: <IPoint><unknown>null };    

        let getTopPlacement = ():  {isInBounds: boolean, point: IPoint} => {
            let x = anchorRect.left;
            let y = anchorRect.top - elementRect.height - paddingPx;
            let isInBounds = HtmlUtility.isRectWithinScreen(x, y, elementRect.width, elementRect.height);
            return {
                isInBounds: isInBounds,
                point: { x: x, y: y }
            };
        };

        let getBottomPlacement = (): {isInBounds: boolean, point: IPoint} => {
            let x = anchorRect.left;
            let y = anchorRect.top + anchorRect.height + paddingPx;
            let isInBounds = HtmlUtility.isRectWithinScreen(x, y, elementRect.width, elementRect.height);
            return {
                isInBounds: isInBounds,
                point: { x: x, y: y }
            };
        };

        if (preference === 'top')  {
            let topResult = getTopPlacement();
            if (topResult.isInBounds) {
                returnValue = { point: topResult.point };
            }
            else {
                // top position faield, so just go for bottom
                let bottomResult = getBottomPlacement();
                if (bottomResult.isInBounds) {
                    returnValue = { point: bottomResult.point };
                }
                else {
                    returnValue = { point: topResult.point };
                }
            }
        }

        if (preference == 'bottom') {
            let bottomResult = getBottomPlacement();
            if (bottomResult.isInBounds) {
                returnValue = { point: bottomResult.point};
            }
            else {
                // bottom position faield, so just go for bottom
                let topResult = getTopPlacement();
                if (topResult.isInBounds) {
                    returnValue = { point: topResult.point};
                }
                else {
                    returnValue = { point: bottomResult.point};
                }
            }
        }

        // check that the return point is still in bounds; if not, adjust
        let rect = {
            left: returnValue.point.x,
            top: returnValue.point.y,
            width: elementRect.width,
            height: elementRect.height
        }

        let result = HtmlUtility.validateRectWithinScreenBounds(rect);
        if (!result.isInBounds) {
            returnValue.point.x += result.x;
            returnValue.point.y += result.y;
        }

        return returnValue;
    }

    // returns if it is in bounds and the x and y ofset needed to make it in-bounds
    public static validateElementWitinScreenBounds(element: HTMLElement): { isInBounds: boolean, x: number, y: number } {
        let boundRect = element.getBoundingClientRect();
        let returnValue = HtmlUtility.validateRectWithinScreenBounds(boundRect);
        return returnValue;
    }

    public static validateRectWithinScreenBounds(boundRect: {left: number, top: number, width: number, height: number}) {
        let returnValue = {
            isInBounds: true,
            x: 0,
            y: 0
        }

        let viewportWdith = document.documentElement.clientWidth;
        let viewportHeight = document.documentElement.clientHeight;

        if ((boundRect.left + boundRect.width) > viewportWdith) {
            returnValue.x = viewportWdith - (boundRect.left + boundRect.width);
        }

        if (boundRect.left < 0) {
            // TODO: This doesn't look right
            returnValue.x = -1*boundRect.left;
        }

        if ((boundRect.top + boundRect.height) > viewportHeight) {
            returnValue.y = viewportHeight - (boundRect.top + boundRect.height);
        }

        if (boundRect.top < 0) {
            // TODO: This doesn't look right
            returnValue.y = -1*boundRect.top;
        }

        returnValue.isInBounds = (returnValue.x === 0) && (returnValue.y === 0);

        return returnValue;
    }

    // returns anchor point in screen coordinates,
    // ensuring that it remains within screen bounds
    public static getAnchorPoint(
        anchorElement: HTMLElement,
        placementElement: HTMLElement,
        hDirection: hPlacement,
        vDirection: vPlacement): IPoint {

        let returnValue: IPoint = {
            x: 0,
            y: 0
        };

        let anchorBounds = anchorElement.getBoundingClientRect();
        let placementBounds = placementElement.getBoundingClientRect();
        if (StringUtility.isNullOrEmpty(hDirection)) {
            hDirection = 'center';
        }

        switch (hDirection) {
            case 'left':
                returnValue.x = anchorBounds.left - placementBounds.width;
                break;

            case 'center':
                returnValue.x = anchorBounds.left + (anchorBounds.width/2) - (placementBounds.width/2);
                break;

            case 'right':
                returnValue.x = anchorBounds.left + anchorBounds.width;
                break;
        }

        if (StringUtility.isNullOrEmpty(vDirection)) {
            vDirection = 'center';
        }

        switch (vDirection) {
            case 'top':
                returnValue.y = anchorBounds.top - placementBounds.height;
                break;
            case 'center':
                returnValue.y = anchorBounds.top + (anchorBounds.height/2) - (placementBounds.height/2);
                break;
            case 'bottom':
                returnValue.y = anchorBounds.top + anchorBounds.height;
                break;
        }

        return returnValue;
    }

    public static getRelativePosition(parentElement: HTMLElement, childElement: HTMLElement): IPoint {
        let parentRect = parentElement.getBoundingClientRect();
        let childRect = childElement.getBoundingClientRect();
        return {
            x: childRect.left - parentRect.left,
            y: childRect.top - parentRect.top
        }
    }

    public static getValue(elementRef: string | HTMLInputElement): string {
        let element: HTMLInputElement = <any>null;
        if (typeof(elementRef) == 'string') {
            element = <HTMLInputElement>document.getElementById(elementRef);
        }
        else {
            element = elementRef;
        }

        return element.value;
    }

    public static setvalue(elementRef: string | HTMLInputElement, value: string): void {
        let element: HTMLInputElement = <any>null;
        if (typeof(elementRef) == 'string') {
            element = <HTMLInputElement>document.getElementById(elementRef);
        }
        else {
            element = elementRef;
        }

        element.value = value;
    }

    public static setText(elementRef: string | HTMLElement, value: string): void {
        let element: HTMLElement = <any>null;
        if (typeof(elementRef) == 'string') {
            element = <HTMLElement>document.getElementById(elementRef);
        }
        else {
            element = elementRef;
        }

        element.textContent = value;
    }

    public static disableField(id: string) {
        (<HTMLInputElement>document.getElementById(id)).disabled = true;
    }

    public static enableField(id: string) {
        (<HTMLInputElement>document.getElementById(id)).disabled = false;
    }

    public static setDisabledForFocusableElements(parentElement: HTMLElement, isDisabled: boolean): void {
        var focusElementList = parentElement.querySelectorAll('input, select, textarea, button, a');
        for (let i = 0; i < focusElementList.length; i++) {
            (<HTMLInputElement>focusElementList[i]).disabled = isDisabled;
        }

        var contentEditableList = parentElement.querySelectorAll('div.contenteditable');
        for (let i = 0; i < contentEditableList.length; i++) {
            (<HTMLElement>contentEditableList[i]).contentEditable = (<any>(!isDisabled)).toString();
        }
    }

    public static createFriendlyUrlText(text: string): string {
        // only keep alphanumeric characters, removing all spaces
        return text.replace(/\W/g, '');
    }

    public static selectInputText(inputElement: HTMLInputElement | HTMLTextAreaElement) {
        let wasInputElementConvertedToText = false;
        if (inputElement.type === 'number') {
            (<HTMLInputElement>inputElement).type = 'text';
            wasInputElementConvertedToText = true;
        }

        window.setTimeout(()=> {
            inputElement.setSelectionRange(0, inputElement.value.length);
            
            if (wasInputElementConvertedToText) {
                (<HTMLInputElement>inputElement).type = 'number';
            }

            window.setTimeout(()=> {
                inputElement.focus();
            }, 80);

        }, 80);
    }
}
