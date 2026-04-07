export default function WelcomeSection({ name }: { name?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 pt-12">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight font-display">
        Xin chào{name ? <>, <span className="text-primary">{name}</span>!</> : '!'}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl font-medium">Hôm nay bạn muốn học thêm kiến thức gì mới?</p>
    </div>
  );
}
