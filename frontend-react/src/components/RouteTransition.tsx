import type { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

type Props = {
  children?: ReactNode;
  className?: string;
};

export function RouteTransition({ children, className = '' }: Props) {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className={`route-transition ${className}`.trim()}
      data-route={location.pathname}
    >
      {children ?? <Outlet />}
    </div>
  );
}
