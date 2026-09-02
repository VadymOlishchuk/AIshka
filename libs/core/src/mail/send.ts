type Mail = { to: string; subject: string; body: string };

/**
 * Поки поштовий сервіс не підключено, лист друкується в консоль сервера.
 * Це свідомо: мовчазна заглушка створила б потік, який виглядає робочим,
 * але нічого нікому не надсилає. Коли з'явиться Resend — заміна тут, в одному місці.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.info(
      `\n[mail] Пошта не налаштована — лист не надіслано.\n` +
        `  Кому: ${mail.to}\n  Тема: ${mail.subject}\n  ${mail.body}\n`,
    );
    return;
  }

  // TODO(етап 3): Resend. Інтерфейс уже такий, яким лишиться.
  throw new Error("Поштовий провайдер налаштований, але не реалізований");
}
