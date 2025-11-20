import { useTranslation } from 'react-i18next';

import { LogoIcon, LogoCutIcon, GoogleIcon, AppleIcon } from '@/components/icons';
import LoginSMS from '@/components/auth/Login';

const RootPage = () => {
    const { t } = useTranslation();

    const initiateGoogleLogin = () => {
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'https://api.klubit.io'}/v1/auth/google/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    const initiateAppleLogin = () => {
        const currentOrigin = window.location.origin;
        window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'https://api.klubit.io'}/v1/auth/apple/microsites?origin=${encodeURIComponent(currentOrigin)}`;
    };

    return (
        <div className="min-h-screen overflow-hidden md:grid md:grid-cols-12 md:gap-2">
            {/* Left Panel - Logo */}
            <div className="hidden md:flex md:col-span-8 bg-white items-center h-screen relative">
                <div className="h-full w-auto relative -translate-x-20">
                    <LogoCutIcon style={{ height: '100%', width: 'auto', objectFit: 'cover' }} />
                </div>
                <div className="absolute bottom-[50px] left-20 z-10">
                    <LogoIcon />
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="col-span-12 md:col-span-4 min-h-screen md:min-h-auto flex flex-col justify-between overflow-auto md:bg-[#F9F9FA]">
                <div className="m-2 md:m-2 p-2 md:p-4 flex flex-col flex-1 rounded-[10px]">
                    <div className="flex flex-col gap-1 md:gap-3 items-center md:items-start text-center md:text-left">
                        {/* Mobile Logo */}
                        <div className="md:hidden">
                            <LogoIcon width={160} height={90} />
                        </div>

                        {/* Title */}
                        <h1 className="text-[28px] md:text-[30px] font-medium font-n27 text-[#ff336d]">
                            {t('login.title')}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-[14px] md:text-[16px] font-normal font-helvetica text-[#98AAC0]">
                            {t('login.subtitle')}
                        </p>

                        {/* Form Section */}
                        <div className="flex flex-col gap-4 w-full">
                            <div className="flex flex-col gap-2">
                                <LoginSMS />

                                {/* Divider */}
                                <div className="my-1 flex items-center justify-center">
                                    <div className="border-t border-[#00000029] w-full max-w-[100px] mx-auto" />
                                </div>

                                {/* Google Login */}
                                <button
                                    onClick={initiateGoogleLogin}
                                    className="flex items-center justify-center gap-2 w-full bg-[#F3F3F4] text-[#1A1F28] text-[16px] font-helvetica font-medium py-4 rounded-[10px] hover:bg-gray-200 transition-colors"
                                >
                                    <GoogleIcon />
                                    {t('welcome.continueWithGoogle')}
                                </button>

                                {/* Apple Login */}
                                <button
                                    onClick={initiateAppleLogin}
                                    className="flex items-center justify-center gap-2 w-full bg-[#F3F3F4] text-[#1A1F28] text-[16px] font-helvetica font-medium py-4 rounded-[10px] hover:bg-gray-200 transition-colors"
                                >
                                    <AppleIcon style={{ color: "#ECF0F5" }} />
                                    {t('welcome.continueWithApple')}
                                </button>

                                {/* Forgot Password & Terms */}
                                <div className="flex flex-col gap-0">
                                    <div className="mt-1 flex items-center justify-center">
                                        <span className="text-[15px] md:text-[16px] font-helvetica font-normal text-[#98AAC0]">
                                            {t('welcome.cantAccess')}
                                            <a
                                                href="/auth/forgot-password"
                                                className="pl-1.5 text-[#ff336d] no-underline font-medium hover:underline"
                                            >
                                                {t('login.forgot_password')}
                                            </a>
                                        </span>
                                    </div>

                                    {/* Terms */}
                                    <div className="flex items-center justify-center flex-col md:flex-row mt-4 gap-0.5">
                                        <p className="text-[14px] font-helvetica font-normal text-[#98AAC0]">
                                            {t('welcome.termsText')}
                                        </p>
                                        <a
                                            href="/terms-and-conditions"
                                            className="text-[14px] font-helvetica font-semibold text-[#98AAC0] underline hover:text-[#252E39] transition-colors"
                                        >
                                            {t('welcome.termsLink')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RootPage;