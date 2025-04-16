import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem }) => {
  const [location] = useLocation();

  const navItems = [
    { label: "Appuntamenti", icon: "fas fa-calendar-day", path: "/" },
    { label: "Clienti", icon: "fas fa-users", path: "/clients" },
  ];

  const stats = {
    today: {
      appointments: 8,
      completed: 5,
      upcoming: 3
    },
    clients: {
      total: 86,
      newLast30Days: 12,
      regulars: 35
    }
  };

  return (
    <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-5">
      <h2 className="font-heading text-xl font-bold mb-6">Dashboard</h2>
      
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              "flex items-center px-3 py-2 rounded",
              location === item.path 
                ? "bg-accent text-white" 
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <i className={`${item.icon} mr-3`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h3 className="font-semibold text-sm uppercase text-slate-500 mb-3">
          {activeItem === "appointments" ? "Statistiche di oggi" : "Statistiche clienti"}
        </h3>
        <div className="space-y-3">
          {activeItem === "appointments" ? (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Appuntamenti</span>
                <span className="font-semibold">{stats.today.appointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Completati</span>
                <span className="font-semibold">{stats.today.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">In arrivo</span>
                <span className="font-semibold">{stats.today.upcoming}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-slate-600">Totale clienti</span>
                <span className="font-semibold">{stats.clients.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nuovi (30g)</span>
                <span className="font-semibold">{stats.clients.newLast30Days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Clienti abituali</span>
                <span className="font-semibold">{stats.clients.regulars}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
