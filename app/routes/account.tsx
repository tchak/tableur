import { Button, Link } from '@heroui/react';
import { href } from 'react-router';

export default function RouteComponent() {
  return (
    <>
      <Button variant="flat" as={Link} href={href('/organizations')}>
        Organizations
      </Button>
    </>
  );
}
