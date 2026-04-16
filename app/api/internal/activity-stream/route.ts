import { subscribeToActivity } from "@/lib/activityStream";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(": connected\n\n"));

      const unsubscribe = subscribeToActivity((event) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          unsubscribe();
        }
      });

      // Keepalive a cada 15s para manter a conexão viva
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 15_000);

      // Cleanup quando o cliente desconecta
      const cancel = () => {
        clearInterval(keepalive);
        unsubscribe();
      };

      // Anexa cancel ao controller para ser chamado em .cancel()
      (controller as unknown as { _cancel?: () => void })._cancel = cancel;
    },
    cancel() {
      (this as unknown as { _cancel?: () => void })._cancel?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
