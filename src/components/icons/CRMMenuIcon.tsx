const Icon = ({ width = 23, height = 20, color = '#1A1F28' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 19 16" fill="none">
        <path d="M17.4884 16H1.4208L0.589722 15.1579V3.36842L1.4208 2.52632H17.4884L18.3195 3.36842V15.1579L17.4884 16ZM2.25188 14.3158H16.6573V4.21053H2.25188V14.3158Z" fill={color} />
        <path d="M9.05013 12.2442L0.844587 7.62386L1.65351 6.15298L9.45459 10.5432L17.1172 6.23158L17.9261 7.70246L9.85905 12.2442H9.05013Z" fill={color} />
        <path d="M13.0559 4.21053H11.3938V1.68421H7.5154V4.21053H5.85324V0.842105L6.68432 0H12.2249L13.0559 0.842105V4.21053Z" fill={color} />
    </svg>
);

export default Icon;