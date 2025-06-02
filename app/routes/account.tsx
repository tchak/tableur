import { Button, Link } from '@heroui/react';
import { href } from 'react-router';
import { Trans } from '@lingui/react/macro';

export default function RouteComponent() {
  return (
    <>
      <Button variant="flat" as={Link} href={href('/organizations')}>
        <Trans>Organizations</Trans>
      </Button>
    </>
  );
}
