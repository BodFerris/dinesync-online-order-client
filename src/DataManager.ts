import { MenuDTO } from './dinesync/dto/MenuDTO';

export class DataManager {
    static async fetchMenuData(): Promise<Array<MenuDTO>> {
        var fetchResult = await fetch('menuTestData.json');
        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }

    static async fetchRestaurantData(): Promise<any> {
        var fetchResult = await fetch('restaurantInfo.json');
        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }

    static async fetchLiquorList(): Promise<any> {
        var fetchResult = await fetch('liquorList.json');
        if (fetchResult.ok) {
            return JSON.parse(await fetchResult.text());
        }
        else {
            throw new Error(fetchResult.status.toString + ': ' + fetchResult.statusText);
        }
    }
}