/**
 * Домен не знає, чим логує застосунок, але події безпеки мають потрапляти
 * в той самий структурований потік, що й решта — інакше «виявлено крадіжку
 * refresh-токена» друкується в консоль і губиться. Бекенд підставляє pino.
 */
export type Logger = {
  info(obj: object, msg: string): void;
  warn(obj: object, msg: string): void;
  error(obj: object, msg: string): void;
};

let sink: Logger = {
  info: (obj, msg) => console.info(msg, obj),
  warn: (obj, msg) => console.warn(msg, obj),
  error: (obj, msg) => console.error(msg, obj),
};

export function setLogger(logger: Logger) {
  sink = logger;
}

export const log: Logger = {
  info: (obj, msg) => sink.info(obj, msg),
  warn: (obj, msg) => sink.warn(obj, msg),
  error: (obj, msg) => sink.error(obj, msg),
};
