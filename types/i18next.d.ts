import 'i18next';
import api from '../../public/locales/en/order.json';
import common from '../../public/locales/en/common.json';

interface I18nNamespaces {
    common: typeof common;
}

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: I18nNamespaces;
    }
}
