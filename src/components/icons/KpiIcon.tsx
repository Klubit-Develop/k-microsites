const KpiIcon = ({ width, height }: { width: number; height: number }) => (
    <svg width={width} height={height} viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.2 2.25C0.2 1.25589 1.00589 0.45 2 0.45H9.94117C10.9353 0.45 11.7412 1.25589 11.7412 2.25V10.4291C11.7412 11.1004 11.3676 11.7159 10.7721 12.0258L6.80154 14.0921C6.28072 14.3631 5.66045 14.3631 5.13964 14.0921L1.16905 12.0258C0.573561 11.7159 0.2 11.1004 0.2 10.4291V2.25Z" fill="url(#paint0_linear_11058_19722)" stroke="url(#paint1_linear_11058_19722)" strokeWidth="0.4" />
        <g filter="url(#filter0_i_11058_19722)">
            <path d="M6.17973 11.3385H5.75904L5.46758 11.2174L4.60968 10.359H3.39434L3.10288 10.2379L2.80591 9.94077L2.68493 9.64912V8.43574L1.82704 7.5773L1.70605 7.28565V6.86468L1.82704 6.57303L2.68493 5.71458V4.50121L2.80591 4.20956L3.10288 3.9124L3.39434 3.79134H4.60968L5.47033 2.93014L5.76179 2.80908H6.18248L6.47395 2.93014L7.33184 3.78859H8.54718L8.83865 3.90965L9.13561 4.2068L9.25659 4.49846V5.71183L10.1145 6.57028L10.2355 6.86193V7.2829L10.1145 7.57455L9.25659 8.43299V9.64637L9.13561 9.93802L8.83865 10.2352L8.54718 10.3562H7.33184L6.47395 11.2147L6.18248 11.3357L6.17973 11.3385ZM5.92952 10.5131H6.00651L6.8644 9.65462L7.15586 9.53356H8.36846L8.42345 9.47853V8.26515L8.54443 7.9735L9.40232 7.11506V7.03802L8.54443 6.17958L8.42345 5.88792V4.67455L8.36846 4.61952H7.15586L6.8644 4.49846L6.00651 3.64001H5.92952L5.07163 4.49846L4.78016 4.61952H3.56482L3.50982 4.67455V5.88792L3.38884 6.17958L2.53095 7.03802V7.11506L3.38884 7.9735L3.50982 8.26515V9.47853L3.56482 9.53356H4.78016L5.07163 9.65462L5.92952 10.5131Z" fill="#3F4A57" />
            <path d="M5.17903 8.46518L3.99668 7.28207L4.5796 6.69877L5.47049 7.59023L7.34575 5.71376L7.92868 6.29706L5.76195 8.46518H5.17903Z" fill="#3F4A57" />
        </g>
        <defs>
            <filter id="filter0_i_11058_19722" x="1.70605" y="2.80908" width="8.5293" height="9.5293" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="0.5" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.17 0" />
                <feBlend mode="normal" in2="shape" result="effect1_innerShadow_11058_19722" />
            </filter>
            <linearGradient id="paint0_linear_11058_19722" x1="11.9412" y1="-0.267858" x2="-0.571017" y2="14.2581" gradientUnits="userSpaceOnUse">
                <stop offset="0.105" stopColor="#37424F" />
                <stop offset="0.78" stopColor="#8594A9" />
            </linearGradient>
            <linearGradient id="paint1_linear_11058_19722" x1="-7.1175e-07" y1="14.75" x2="12.5122" y2="0.223997" gradientUnits="userSpaceOnUse">
                <stop offset="0.21" stopColor="#384350" />
                <stop offset="0.84" stopColor="#79879A" />
            </linearGradient>
        </defs>
    </svg>
);

export default KpiIcon;