import { Button } from '@heroui/react';
import { ArrowRightIcon } from 'lucide-react';

export default function RouteComponent() {
  return (
    <section className="z-20 flex flex-col items-center justify-center gap-[18px] sm:gap-6">
      <div className="text-center text-[clamp(40px,10vw,44px)] leading-[1.2] font-bold tracking-tighter sm:text-[64px]">
        <div className="bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
          Easiest way to <br /> manage your data.
        </div>
      </div>
      <p className="text-default-500 text-center leading-7 font-normal sm:w-[466px] sm:text-[18px]">
        Eiusmod ullamco nisi proident irure consequat Lorem minim et amet ipsum
        pariatur nostrud exercitation. Cupidatat nulla dolor sunt ut pariatur ex
        ex deserunt ex id dolore. Sint do est pariatur sint veniam.
      </p>
      <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
        <Button
          className="bg-default-foreground text-small text-background h-10 w-[163px] px-[16px] py-[10px] leading-5 font-medium"
          radius="full"
        >
          Get Started
        </Button>
        <Button
          className="border-default-100 text-small h-10 w-[163px] border-1 px-[16px] py-[10px] leading-5 font-medium"
          endContent={
            <span className="pointer-events-none flex h-[22px] w-[22px] items-center justify-center">
              <ArrowRightIcon className="text-default-500 [&>path]:stroke-[1.5]" />
            </span>
          }
          radius="full"
          variant="bordered"
        >
          See our plans
        </Button>
      </div>
    </section>
  );
}
