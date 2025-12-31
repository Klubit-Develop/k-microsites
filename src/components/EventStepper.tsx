import { useTranslation } from 'react-i18next';

interface Step {
    key: string;
    labelKey: string;
    defaultLabel: string;
}

interface EventStepperProps {
    currentStep: number;
    steps?: Step[];
    isLoading?: boolean;
    className?: string;
}

const defaultSteps: Step[] = [
    { key: 'rates', labelKey: 'event.stepper.rates', defaultLabel: 'Tarifas' },
    { key: 'payment', labelKey: 'event.stepper.payment', defaultLabel: 'Pago' },
];

const EventStepper = ({
    currentStep,
    steps = defaultSteps,
    isLoading = false,
    className = '',
}: EventStepperProps) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center w-full px-[470px] animate-pulse ${className}`}>
                {steps.map((_, index) => (
                    <div key={index} className="contents">
                        <div className="flex items-center gap-[7px] px-6">
                            <div className="w-[23px] h-[23px] bg-[#232323] rounded-full" />
                            <div className="h-4 w-16 bg-[#232323] rounded" />
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px bg-[#232323]" />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center w-full px-[470px] ${className}`}>
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber <= currentStep;
                const isCompleted = stepNumber < currentStep;

                return (
                    <div key={step.key} className="contents">
                        <div className="flex items-center gap-[7px] px-6">
                            <div 
                                className={`
                                    flex items-center justify-center w-[23px] h-[23px] border rounded-full
                                    ${isActive 
                                        ? 'bg-[#e5ff88] border-[#e5ff88]' 
                                        : 'bg-[#939393] border-[#939393]'
                                    }
                                `}
                            >
                                <span className="text-[#141414] text-[16px] font-medium font-helvetica">
                                    {isCompleted ? '✓' : stepNumber}
                                </span>
                            </div>
                            <span 
                                className={`
                                    text-[14px] font-normal font-helvetica
                                    ${isActive ? 'text-[#e5ff88]' : 'text-[#939393]'}
                                `}
                            >
                                {t(step.labelKey, step.defaultLabel)}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px bg-[#939393]" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default EventStepper;
export type { Step };