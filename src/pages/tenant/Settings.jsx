import React from 'react';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function TenantSettings() {
    const { t } = useTranslation();

    return (
        <div className="p-4 max-w-2xl">
            <h2 className="text-xl font-bold mb-4">{t('settings.title')}</h2>

            {/* Appearance: theme + language (available to every role). */}
            <div className="bg-white rounded-lg border shadow-sm p-5 mb-4">
                <h3 className="font-semibold text-gray-700 mb-3">{t('settings.appearance')}</h3>

                <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">{t('settings.theme')}</span>
                    <div className="w-44"><ThemeToggle /></div>
                </div>

                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">{t('settings.language')}</span>
                    <LanguageSwitcher />
                </div>
            </div>

            {/* Organization settings (tenant_manager only). */}
            <div className="bg-white rounded-lg border shadow-sm p-5">
                <h3 className="font-semibold text-gray-700">{t('settings.org_title')}</h3>
                <p className="text-gray-500 text-sm mt-1">{t('settings.org_subtitle')}</p>
            </div>
        </div>
    );
}
