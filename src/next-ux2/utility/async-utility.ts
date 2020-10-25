export class AsyncUtility {
    static  wait(durationMs: number): Promise<void> {
        return new Promise<void>((accept) => {
            setTimeout(() => {
                accept();
            }, durationMs);
        });
    }

    static waitNextUitick(): Promise<void> {
        return AsyncUtility.wait(60);
    }
}