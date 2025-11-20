const Icon = ({ width = 23, height = 20, color = '#1A1F28' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 18 16" fill="none">
        <path d="M14.3697 4.47L10.1197 0.22L9.58972 0H2.33972L1.58972 0.75V15.25L2.33972 16H13.8397L14.5897 15.25V5L14.3697 4.47ZM12.0247 4.25H10.3347V2.56L12.0247 4.25ZM3.08972 14.5V1.5H8.83972V5L9.58972 5.75H13.0897V14.5H3.08972Z" fill={color} />
        <path d="M11.7147 11.875H4.46472V13.125H11.7147V11.875Z" fill={color} />
        <path d="M11.7147 9.375H4.46472V10.625H11.7147V9.375Z" fill={color} />
        <path d="M11.7147 6.875H4.46472V8.125H11.7147V6.875Z" fill={color} />
        <path d="M7.46472 2.875H4.46472V4.125H7.46472V2.875Z" fill={color} />
    </svg>
);

export default Icon;