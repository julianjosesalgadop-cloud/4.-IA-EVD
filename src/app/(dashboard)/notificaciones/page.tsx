export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto">
          <span className="text-3xl">🔔</span>
        </div>
        <h2 className="text-xl font-bold">Notificaciones</h2>
        <p className="text-muted-foreground text-sm">Centro de notificaciones del sistema</p>
      </div>
    </div>
  );
}
