import { useTranslation } from 'react-i18next';

interface Step {
    key: string;
    labelKey: string;
    defaultLabel: string;
}

interface EventStepperProps {
    currentStep: number;
    steps?: Step[];
    onStepClick?: (step: number) => void;
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
    onStepClick,
    isLoading = false,
    className = '',
}: EventStepperProps) => {
    const { t } = useTranslation();

    const handleStepClick = (stepNumber: number) => {
        if (onStepClick && stepNumber <= currentStep) {
            onStepClick(stepNumber);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center w-full px-[16px] ${className}`}>
                <div className="flex items-center justify-center rounded-[6px] w-full max-w-[370px] md:max-w-[500px] animate-pulse">
                    {steps.map((_, index) => (
                        <div key={index} className="contents">
                            <div className="flex flex-col items-center justify-center px-[24px]">
                                <div className="flex gap-[7px] items-center justify-center">
                                    <div className="w-[23px] h-[23px] bg-[#232323] rounded-full" />
                                    <div className="h-[14px] w-12 bg-[#232323] rounded" />
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="flex-1 h-px bg-[#232323] min-w-[40px]" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center w-full px-[16px] ${className}`}>
            <div className="flex items-center justify-center rounded-[6px] w-full max-w-[370px] md:max-w-[500px]">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber <= currentStep;
                    const isCompleted = stepNumber < currentStep;
                    const isClickable = onStepClick && stepNumber <= currentStep;

                    return (
                        <div key={step.key} className="contents">
                            <button
                                type="button"
                                onClick={() => handleStepClick(stepNumber)}
                                disabled={!isClickable}
                                className={`
                                    flex flex-col items-center justify-center px-[24px] py-0
                                    bg-transparent border-none outline-none
                                    ${isClickable
                                        ? 'cursor-pointer hover:opacity-80 transition-opacity'
                                        : 'cursor-default'
                                    }
                                `}
                            >
                                <div className="flex gap-[7px] items-center justify-center">
                                    <div
                                        className={`
                                            flex items-center justify-center w-[23px] h-[23px] border rounded-[20px]
                                            transition-colors shrink-0
                                            ${isActive
                                                ? 'bg-[#e5ff88] border-[#e5ff88]'
                                                : 'bg-[#939393] border-[#939393]'
                                            }
                                        `}
                                    >
                                        <span className="text-[#141414] text-[16px] font-medium font-helvetica leading-none">
                                            {stepNumber}
                                        </span>
                                    </div>
                                    <span
                                        className={`
                                            text-[14px] font-normal font-helvetica transition-colors whitespace-nowrap leading-none
                                            ${isActive ? 'text-[#e5ff88]' : 'text-[#939393]'}
                                        `}
                                    >
                                        {t(step.labelKey, step.defaultLabel)}
                                    </span>
                                </div>
                            </button>
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                                        flex-1 h-px transition-colors min-w-[40px]
                                        ${isCompleted ? 'bg-[#e5ff88]' : 'bg-[#939393]'}
                                    `}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventStepper;
export type { Step };