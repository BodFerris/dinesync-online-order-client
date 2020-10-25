import { FloorItemType, FloorItemDTO } from '../FloorplanDTO';


export class FloorLayoutHelper {
    static isItemWall(floorItemType: FloorItemType): boolean {
        return (floorItemType === 'HWall') ||
                (floorItemType === 'VWall') ||
                (floorItemType === 'CornerWall');
    }

    static isItemBar(floorItemType: FloorItemType): boolean {
        return (floorItemType === 'CornerWall') ||
            (floorItemType === 'BarIsland') ||
            (floorItemType === 'BarThreeSided' ) ||
            (floorItemType === 'HBar') ||
            (floorItemType == 'VBar');
    }

    static isItemTable(floorItemType: FloorItemType): boolean {
        return (floorItemType === 'CircularTable') || (floorItemType === 'SquareTable');
    }

    static getNextWallIndex(layoutList: Array<FloorItemDTO>) {
        for (let i=0; i < layoutList.length; i++) {
            let layoutItem = layoutList[i];
            if (!FloorLayoutHelper.isItemWall(layoutItem.floorItemType)) {
                return i;
            }
        }

        return 0;
    }

    static getNextBarIndex(layoutList: Array<FloorItemDTO>) {
        for (let i=0; i < layoutList.length; i++) {
            let layoutItem = layoutList[i];
            if (!FloorLayoutHelper.isItemWall(layoutItem.floorItemType) 
                    && !FloorLayoutHelper.isItemBar(layoutItem.floorItemType)) {
                return i;
            }
        }
        return 0;
    }

    static getNextTableIndex(layoutList: Array<FloorItemDTO>) {
        for (let i=0; i < layoutList.length; i++) {
            let layoutItem = layoutList[i];
            if (!FloorLayoutHelper.isItemWall(layoutItem.floorItemType) 
                    && !FloorLayoutHelper.isItemBar(layoutItem.floorItemType)
                    && !FloorLayoutHelper.isItemTable(layoutItem.floorItemType)) {
                return i;
            }
        }

        return 0;
    }

    static getNextItemIndex(itemType: FloorItemType, layoutList: Array<FloorItemDTO>) {
        if (FloorLayoutHelper.isItemWall(itemType)) {
            return FloorLayoutHelper.getNextWallIndex(layoutList);
        }
        else if (FloorLayoutHelper.isItemBar(itemType)) {
            return FloorLayoutHelper.getNextBarIndex(layoutList);
        }
        else if (FloorLayoutHelper.isItemTable(itemType)) {
            return FloorLayoutHelper.getNextTableIndex(layoutList);
        }
        else {
            return layoutList.length;
        }
    }

    static sortLayoutList(list: Array<FloorItemDTO>) {
        list.sort((a, b) => {

            if (FloorLayoutHelper.isItemWall(a.floorItemType)) {
                return -1;
            }
            else if (FloorLayoutHelper.isItemWall(b.floorItemType)) {
                return 1;
            }
            else if (FloorLayoutHelper.isItemBar(a.floorItemType)) {
                return -1;
            }
            else if (FloorLayoutHelper.isItemBar(b.floorItemType)) {
                return 1;
            }
            else if (FloorLayoutHelper.isItemTable(a.floorItemType)) {
                return -1;
            }
            else if (FloorLayoutHelper.isItemTable(b.floorItemType)) {
                return 1;
            }
            else if (!FloorLayoutHelper.isItemWall(a.floorItemType)
                    && !FloorLayoutHelper.isItemBar(a.floorItemType)
                    && !FloorLayoutHelper.isItemTable(a.floorItemType)) {
                return 1;
            }
            else if (!FloorLayoutHelper.isItemWall(b.floorItemType)
                    && !FloorLayoutHelper.isItemBar(b.floorItemType)
                    && !FloorLayoutHelper.isItemTable(b.floorItemType)) {
                return -1;
            }
        });
    }

}