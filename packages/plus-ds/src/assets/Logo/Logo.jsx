import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import './Logo.scss';

/**
 * Logo Component
 * 
 * PLUS brand logo component with multiple styles, sizes, and optional text wordmark.
 * Matches Figma design system specifications.
 * 
 * @param { string } style - Visual style: 'colored', 'filled', or 'outlined'
            */
const Logo = ({ style = 'colored', size = 'M', text = false, className = '', ...props }) => {
    // Normalize size to lowercase for CSS classes
    const sizeClass = size.toLowerCase();

    // Build class names
    const classNames = [
        'plus-logo',
        `plus-logo--${sizeClass}`,
        `plus-logo--${style}`,
        text && 'plus-logo--with-text',
        className
    ].filter(Boolean).join(' ');

    // unique ID prefix for this instance to avoid SVG mask/filter collisions
    const idPrefix = useMemo(() => `logo-${style}-${sizeClass}-${Math.random().toString(36).substr(2, 9)}`, [style, sizeClass]);

    // Target dimensions for the container (CSS handles strict sizing, but good for specific overrides if needed)
    // We rely on viewBox scaling for the internal SVG

    // Logo Icon Implementation from Figma
    // Colored: 92x92 base
    // Filled: 92x92 base
    // Outlined: 102x102 base (stroke adds width)
    const LogoIcon = () => {
        if (style === 'colored') {
            return (
                <svg viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg" className="plus-logo-svg">
                    <g clipPath={`url(#${idPrefix}-clip-colored)`}>
                        <rect width="92" height="92" rx="9.2" fill="#F9F9FC" fillOpacity="0.08" />
                        <g>
                            <g filter={`url(#${idPrefix}-blur-0)`}>
                                <path d="M71.2335 53.1843C84.9884 66.9389 84.9884 89.24 71.2335 102.995C57.4789 116.75 35.1778 116.75 21.4231 102.995C7.66821 89.24 7.66821 66.9389 21.4231 53.1843C35.1778 39.4294 57.4789 39.4294 71.2335 53.1843Z" fill="#FFDEA0" />
                            </g>
                            <g filter={`url(#${idPrefix}-blur-1)`}>
                                <path d="M71.2335 53.1843C84.9884 66.9389 84.9884 89.24 71.2335 102.995C57.4789 116.75 35.1778 116.75 21.4231 102.995C7.66821 89.24 7.66821 66.9389 21.4231 53.1843C35.1778 39.4294 57.4789 39.4294 71.2335 53.1843Z" fill="#FFE17A" />
                            </g>
                            <g filter={`url(#${idPrefix}-blur-2)`}>
                                <path d="M44.7713 -18.9113C61.3054 -2.37711 61.3054 24.43 44.7713 40.9642C28.2371 57.4983 1.42994 57.4983 -15.1042 40.9642C-31.6384 24.43 -31.6384 -2.37713 -15.1042 -18.9113C1.42994 -35.4455 28.2371 -35.4455 44.7713 -18.9113Z" fill="#FFE17A" />
                            </g>
                            <g filter={`url(#${idPrefix}-blur-3)`}>
                                <path d="M113.874 109.296C129.335 93.834 129.335 68.7657 113.874 53.304C98.412 37.8424 73.3437 37.8424 57.8821 53.304C42.4204 68.7657 42.4204 93.834 57.8821 109.296C73.3437 124.757 98.412 124.757 113.874 109.296Z" fill="#B3F1BF" />
                            </g>
                            <g filter={`url(#${idPrefix}-blur-4)`}>
                                <path d="M52.7187 41.0705C71.3084 59.6602 71.3084 89.8002 52.7187 108.39C34.1289 126.98 3.98891 126.98 -14.6008 108.39C-33.1905 89.8002 -33.1905 59.6602 -14.6008 41.0705C3.98891 22.4808 34.1289 22.4808 52.7187 41.0705Z" fill="#FFD9E4" />
                            </g>
                            <g filter={`url(#${idPrefix}-blur-5)`}>
                                <path d="M114.964 32.5756C131.856 15.6839 131.783 -11.7753 114.802 -28.7564C97.8213 -45.7374 70.3621 -45.8099 53.4705 -28.9182C36.5788 -12.0266 36.6513 15.4327 53.6323 32.4137C70.6134 49.3947 98.0726 49.4672 114.964 32.5756Z" fill="#84CFFF" />
                            </g>
                        </g>
                        <path d="M72.7375 9.20002C73.5314 9.20002 74.175 9.84362 74.175 10.6375V17.825H81.3625C82.1564 17.825 82.8 18.4686 82.8 19.2625V22.1375C82.8 22.9314 82.1564 23.575 81.3625 23.575H74.175V30.7625C74.175 31.5564 73.5314 32.2 72.7375 32.2H69.8625C69.0686 32.2 68.425 31.5564 68.425 30.7625V23.575H61.2375C60.4436 23.575 59.8 22.9314 59.8 22.1375V19.2625C59.8 18.4686 60.4436 17.825 61.2375 17.825H68.425V10.6375C68.425 9.84362 69.0686 9.20002 69.8625 9.20002H72.7375Z" fill="#F9F9FC" />
                    </g>
                    <defs>
                        <filter id={`${idPrefix}-blur-0`} x="-44.0931" y="-12.3319" width="180.843" height="180.843" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <filter id={`${idPrefix}-blur-1`} x="-44.0931" y="-12.3319" width="180.843" height="180.843" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <filter id={`${idPrefix}-blur-2`} x="-82.7048" y="-86.5119" width="195.077" height="195.077" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <filter id={`${idPrefix}-blur-3`} x="-8.91419" y="-13.4922" width="189.584" height="189.584" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <filter id={`${idPrefix}-blur-4`} x="-83.7431" y="-28.0718" width="205.604" height="205.604" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <filter id={`${idPrefix}-blur-5`} x="-14.351" y="-96.7397" width="197.137" height="197.137" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix" />
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                            <feGaussianBlur stdDeviation="27.6" result="effect1_foregroundBlur" />
                        </filter>
                        <clipPath id={`${idPrefix}-clip-colored`}>
                            <rect width="92" height="92" rx="9.2" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            );
        }

        if (style === 'filled') {
            return (
                <svg viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg" className="plus-logo-svg">
                    <path d="M82.5547 0C87.7711 0.000152554 91.9998 4.22888 92 9.44531V82.5547C91.9998 87.7711 87.7711 91.9998 82.5547 92H9.44531C4.22888 91.9998 0.000152557 87.7711 0 82.5547V9.44531C0.000155646 4.22888 4.22888 0.000155649 9.44531 0H82.5547ZM70.6875 8.49219C69.9061 8.49242 69.2717 9.12583 69.2715 9.90723V16.9844H61.6074C60.8045 16.9848 60.1533 17.619 60.1533 18.4004V21.2305C60.1533 22.0119 60.8045 22.646 61.6074 22.6465H69.2715V29.7227C69.2715 30.5042 69.906 31.1384 70.6875 31.1387H73.5176C74.2993 31.1387 74.9336 30.5044 74.9336 29.7227V22.6465H81.9707C82.774 22.6465 83.4258 22.0122 83.4258 21.2305V18.4004C83.4258 17.6187 82.774 16.9844 81.9707 16.9844H74.9336V9.90723C74.9334 9.12568 74.2992 8.49219 73.5176 8.49219H70.6875Z" fill="currentColor" />
                </svg>
            );
        }

        // Outlined style
        return (
            <svg viewBox="0 0 102 102" fill="none" xmlns="http://www.w3.org/2000/svg" className="plus-logo-svg">
                <path d="M87.1547 2.3002C93.6414 2.30035 98.8996 7.55862 98.8998 14.0453V87.1547C98.8997 93.6414 93.6414 98.8997 87.1547 98.8998H14.0453C7.55862 98.8996 2.30035 93.6414 2.3002 87.1547V14.0453C2.30035 7.55862 7.55862 2.30035 14.0453 2.3002H87.1547Z" stroke="currentColor" strokeWidth="4.6" />
                <path d="M78.1181 13.0922C78.8997 13.0922 79.5339 13.7257 79.5341 14.5072V21.5844H86.5712C87.3745 21.5844 88.0263 22.2187 88.0263 23.0004V25.8305C88.0263 26.6121 87.3745 27.2465 86.5712 27.2465H79.5341V34.3226C79.5341 35.1043 78.8998 35.7387 78.1181 35.7387H75.288C74.5063 35.7387 73.872 35.1043 73.872 34.3226V27.2465H66.2079C65.4048 27.2462 64.7538 26.612 64.7538 25.8305V23.0004C64.7538 22.2188 65.4048 21.5846 66.2079 21.5844H73.872V14.5072C73.8721 13.7257 74.5064 13.0922 75.288 13.0922H78.1181Z" fill="currentColor" />
            </svg>
        );
    };

    // Text wordmark SVG - extracted from Figma
    // Base dimensions ~247x92 (roughly M size in legacy logic, but exact Figma path here)
    const LogoText = () => {
        // Use currentColor for flexibility, fallback logic can be in CSS or parent
        const fillColor = style === 'colored' ? '#3F484A' : 'currentColor';

        return (
            <svg viewBox="0 0 247 92" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.2777 7.11776C33.6111 7.11776 41.1513 9.17587 45.8981 13.2921C50.6449 17.4083 53.0183 23.1745 53.0183 30.5908C53.0183 33.9619 52.4706 37.1732 51.3752 40.2249C50.3163 43.2411 48.5636 45.9202 46.1172 48.2621C43.6707 50.5686 40.4392 52.3961 36.4227 53.7445C32.4427 55.0929 27.5315 55.7671 21.6893 55.7671H13.145V84.9355H0V7.11776H23.2777ZM22.4013 17.7099H13.145V45.1218H20.32C24.4461 45.1218 27.9514 44.6605 30.8361 43.7379C33.7207 42.7798 35.9115 41.2717 37.4086 39.2136C38.9056 37.1555 39.6542 34.4409 39.6542 31.0699C39.6542 26.5633 38.2484 23.21 35.4368 21.01C32.6618 18.8099 28.3166 17.7099 22.4013 17.7099Z" fill={fillColor} />
                <path d="M64.5246 84.9355V7.11776H77.6696V74.0772H111.682V84.9355H64.5246Z" fill={fillColor} />
                <path d="M183.93 7.11776V57.4704C183.93 62.8995 182.743 67.7609 180.37 72.0546C178.033 76.3482 174.491 79.7547 169.744 82.2741C164.997 84.758 159.027 86 151.834 86C141.573 86 133.759 83.3919 128.392 78.1756C123.061 72.9239 120.395 65.9512 120.395 57.2575V7.11776H133.54V56.1397C133.54 62.6334 135.11 67.4238 138.251 70.511C141.391 73.5981 146.083 75.1417 152.327 75.1417C156.635 75.1417 160.141 74.4143 162.843 72.9594C165.581 71.4691 167.59 69.3045 168.868 66.4657C170.182 63.5915 170.839 60.1317 170.839 56.0865V7.11776H183.93Z" fill={fillColor} />
                <path d="M246.154 63.7512C246.154 68.3642 244.985 72.3384 242.649 75.674C240.348 79.0095 237.025 81.5644 232.68 83.3387C228.372 85.1129 223.223 86 217.235 86C214.314 86 211.52 85.8403 208.855 85.521C206.189 85.2016 203.67 84.7403 201.296 84.1371C198.96 83.4983 196.823 82.7354 194.888 81.8483V69.819C198.138 71.2029 201.771 72.4626 205.788 73.5981C209.804 74.6982 213.894 75.2482 218.056 75.2482C221.452 75.2482 224.264 74.8224 226.491 73.9707C228.755 73.0836 230.435 71.8416 231.53 70.2448C232.625 68.6126 233.173 66.7141 233.173 64.5496C233.173 62.2431 232.534 60.2914 231.256 58.6946C229.978 57.0978 228.043 55.6429 225.45 54.33C222.894 52.9816 219.681 51.5445 215.811 50.0186C213.182 48.9896 210.662 47.8186 208.252 46.5057C205.879 45.1927 203.761 43.6491 201.899 41.8749C200.037 40.1007 198.558 38.0071 197.462 35.5941C196.404 33.1457 195.874 30.2715 195.874 26.9714C195.874 22.5713 196.951 18.8099 199.106 15.6873C201.296 12.5646 204.364 10.1694 208.307 8.50166C212.287 6.83389 216.924 6 222.219 6C226.418 6 230.362 6.42582 234.049 7.27745C237.774 8.12908 241.425 9.33555 245.004 10.8969L240.841 21.1697C237.555 19.8567 234.36 18.8099 231.256 18.0293C228.189 17.2486 225.049 16.8583 221.836 16.8583C219.06 16.8583 216.705 17.2664 214.77 18.0825C212.835 18.8986 211.356 20.0519 210.334 21.5422C209.348 22.9971 208.855 24.7359 208.855 26.7585C208.855 29.0295 209.421 30.9457 210.553 32.507C211.721 34.0328 213.51 35.4345 215.92 36.7119C218.367 37.9894 221.507 39.4087 225.341 40.9701C229.759 42.7443 233.502 44.6072 236.569 46.5589C239.673 48.5105 242.046 50.8525 243.689 53.5848C245.332 56.2817 246.154 59.6704 246.154 63.7512Z" fill={fillColor} />
            </svg>
        );
    };

    return (
        <div className={classNames} {...props}>
            <div className="plus-logo__container">
                <div className="plus-logo__icon">
                    <LogoIcon />
                </div>
            </div>
            {text && (
                <div className="plus-logo__text">
                    <LogoText />
                </div>
            )}
        </div>
    );
};

Logo.propTypes = {
    /** Visual style of the logo */
    style: PropTypes.oneOf(['colored', 'filled', 'outlined']),
    /** Size variant */
    size: PropTypes.oneOf(['XS', 'S', 'M', 'L', 'XL']),
    /** Whether to show text wordmark */
    text: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string
};

Logo.defaultProps = {
    style: 'colored',
    size: 'M',
    text: false,
    className: ''
};

export default Logo;
export { Logo };
