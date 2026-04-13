export default function RecentRequests() {
  const requests = [
    {
      id: 1,
      title: "Ebook: UI/UX Design Trends 2024",
      icon: "description",
      iconColor: "text-primary",
      date: "20/05/2024",
      status: "Hoàn thành",
      statusColor: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
      actionIcon: "download",
      actionClass: "text-primary hover:text-primary/80 cursor-pointer"
    },
    {
      id: 2,
      title: "Video Course: Advanced Python Scripts",
      icon: "play_circle",
      iconColor: "text-accent-purple",
      date: "18/05/2024",
      status: "Đang chờ duyệt",
      statusColor: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20",
      actionIcon: "more_horiz",
      actionClass: "text-zinc-500 dark:text-slate-500 cursor-not-allowed"
    },
    {
      id: 3,
      title: "Dataset: Finance Market 2023 Analysis",
      icon: "data_object",
      iconColor: "text-primary",
      date: "15/05/2024",
      status: "Hoàn thành",
      statusColor: "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20",
      actionIcon: "download",
      actionClass: "text-primary hover:text-primary/80 cursor-pointer"
    }
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-white">
          <span className="material-icons text-primary">history_edu</span>
          Yêu cầu mới nhất
        </h3>
        <a className="text-primary text-sm font-medium hover:underline" href="#">Xem tất cả</a>
      </div>
      <div className="bg-white/50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-xl dark:shadow-2xl">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-100/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-zinc-300 dark:border-white/5 sticky top-[65px] z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400">Tên tài liệu / Khóa học</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400">Ngày yêu cầu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-slate-400 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`material-icons ${req.iconColor}`}>{req.icon}</span>
                      <span className="font-medium text-zinc-800 dark:text-slate-200">{req.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-slate-400">{req.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${req.statusColor}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`${req.actionClass} transition-colors`}>
                      <span className="material-icons">{req.actionIcon}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
