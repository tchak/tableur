import { remember } from '@epic-web/remember';
import { setupI18n } from '@lingui/core';
import { resolveAcceptLanguage } from 'resolve-accept-language';

import { messages as en_messages } from '../locales/en/messages';
import { messages as fr_messages } from '../locales/fr/messages';
import { en_locale, fr_locale, locales } from './i18n';

const messages = {
  [en_locale]: en_messages,
  [fr_locale]: fr_messages,
};

export function getI18n(request: Request) {
  const acceptLanguageHeader = request.headers.get('accept-language') ?? '';
  const locale = resolveAcceptLanguage(
    acceptLanguageHeader,
    locales,
    en_locale,
  );
  return remember(`i18n-${locale}`, () =>
    setupI18n({ locale, messages: { [locale]: messages[locale] } }),
  );
}
