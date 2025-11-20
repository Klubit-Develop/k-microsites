const Icon = ({ width = 20, height = 20, color = '#1A1F28' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 33 41" fill="none">
        <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M1.98001 0H31.02L33 1.92188V39.0781L31.02 41H1.98001L0 39.0781V1.92188L1.98001 0ZM3.95999 23V37.1562H29.04V23H3.95999ZM3.95999 9V3.84375H29.04V9H3.95999ZM13.4521 19.5846L14.0647 20L16.5 18.3885L18.9353 20L19.5479 19.5846L18.6782 16.8558L21 15.2014L20.758 14.5211H17.8235L16.8782 12H16.1218L15.1765 14.5211H12.242L12 15.2014L14.3218 16.8558L13.4521 19.5846Z"
            fill={color}
        />
    </svg>
);

export default Icon;
