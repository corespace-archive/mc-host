declare const app: any;
declare const http: any;
declare const io: any;
declare const tail: any;
declare const fs: any;
declare const exec: any;
declare let activeWatcher: boolean;
declare function executeCommand(socket: {
    emit: (arg0: string, arg1: string) => void;
}, cmd: String): void;
