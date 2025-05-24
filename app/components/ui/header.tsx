import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
  type LinkProps,
} from '@heroui/react';
import { useState, useMemo } from 'react';
import { useLocation } from 'react-router';
import { SnowflakeIcon } from 'lucide-react';

export interface HeaderItem {
  label: string;
  href: string;
}

export function Header({
  items,
  user,
}: {
  items: HeaderItem[];
  user?: { email: string } | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const pages = useMemo(
    () =>
      items.map((page) => {
        const isActive = location.pathname == page.href;
        return {
          ...page,
          isActive,
          current: isActive ? ('page' as const) : undefined,
        };
      }),
    [items, location.pathname],
  );
  return (
    <Navbar isBordered shouldHideOnScroll onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          className="sm:hidden"
        />
        <NavbarBrand as={BrandLink} href="/">
          <SnowflakeIcon />
          <p className="ml-2 font-bold text-inherit">Tableur</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        {pages.map((page) => (
          <NavbarItem isActive={page.isActive} key={page.href}>
            <Link
              color={page.isActive ? 'primary' : 'foreground'}
              href={page.href}
              aria-current={page.current}
            >
              {page.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          {user ? (
            <Button as={Link} href="/account" variant="flat">
              {user.email}
            </Button>
          ) : (
            <Button as={Link} href="/login" variant="flat">
              Sign In
            </Button>
          )}
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu>
        {pages.map((page) => (
          <NavbarMenuItem isActive={page.isActive} key={page.href}>
            <Link
              color="foreground"
              href={page.href}
              aria-current={page.current}
            >
              {page.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}

function BrandLink(props: LinkProps) {
  return <Link {...props} color="foreground" />;
}
