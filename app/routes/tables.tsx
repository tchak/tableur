import { Outlet } from 'react-router';

export default function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 px-2 md:flex-row">
      <Outlet />
    </div>
  );
}
