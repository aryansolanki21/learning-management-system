import { ChartNoAxesColumn, SquareLibrary } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: ChartNoAxesColumn,
  },
  {
    label: "Courses",
    path: "/admin/course",
    icon: SquareLibrary,
  },
];

const Sidebar = () => {
  const getLinkClassName = (isActive) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
    }`;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full min-w-0 flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 self-start overflow-y-auto border-r border-gray-200 bg-gray-50 p-5 lg:block">
        <nav aria-label="Instructor navigation" className="space-y-2">
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/admin/course"}
              className={({ isActive }) => getLinkClassName(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Admin content and mobile navigation */}
      <div className="w-full min-w-0 flex-1">
        {/* Mobile/tablet navigation */}
        <nav
          aria-label="Instructor navigation"
          className="sticky top-16 z-30 flex w-full min-w-0 gap-2 border-b border-gray-200 bg-white px-4 py-3 lg:hidden"
        >
          {navigationItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/admin/course"}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main page content */}
        <main className="w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Sidebar;
