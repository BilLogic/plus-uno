/**
 * @fileoverview SVG templates for PLUS Logo component
 * Based on Figma design system specifications
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=1133-12915
 */

/**
 * SVG template for colored icon style
 * Based on user-provided example
 */
export const getColoredIconSVG = (size = 'XS') => {
    const sizeMap = {
        XS: { width: 40, height: 40, viewBox: '0 0 40 40' },
        S: { width: 64, height: 64, viewBox: '0 0 40 40' },
        M: { width: 92, height: 92, viewBox: '0 0 40 40' },
        L: { width: 144, height: 144, viewBox: '0 0 40 40' },
        XL: { width: 160, height: 160, viewBox: '0 0 40 40' }
    };
    
    const dimensions = sizeMap[size] || sizeMap.XS;
    const filterId = `filter_${size.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${dimensions.viewBox}" fill="none">
  <g filter="url(#${filterId}_0)">
    <path d="M30.9711 23.1236C36.9515 29.1039 36.9515 38.8 30.9711 44.7803C24.9908 50.7607 15.2947 50.7607 9.3144 44.7803C3.334 38.8 3.334 29.1039 9.3144 23.1236C15.2947 17.1432 24.9908 17.1432 30.9711 23.1236Z" fill="#FFDEA0"/>
  </g>
  <g filter="url(#${filterId}_1)">
    <path d="M30.9711 23.1236C36.9515 29.1039 36.9515 38.8 30.9711 44.7803C24.9908 50.7607 15.2947 50.7607 9.3144 44.7803C3.334 38.8 3.334 29.1039 9.3144 23.1236C15.2947 17.1432 24.9908 17.1432 30.9711 23.1236Z" fill="#FFE17A"/>
  </g>
  <g filter="url(#${filterId}_2)">
    <path d="M19.4658 -8.22229C26.6545 -1.03353 26.6545 10.6217 19.4658 17.8105C12.277 24.9993 0.621712 24.9993 -6.56705 17.8105C-13.7558 10.6217 -13.7558 -1.03354 -6.56705 -8.2223C0.621712 -15.4111 12.277 -15.4111 19.4658 -8.22229Z" fill="#FFE17A"/>
  </g>
  <g filter="url(#${filterId}_3)">
    <path d="M49.5103 47.5199C56.2328 40.7974 56.2328 29.8981 49.5103 23.1757C42.7878 16.4532 31.8886 16.4532 25.1661 23.1757C18.4437 29.8981 18.4437 40.7974 25.1661 47.5199C31.8886 54.2423 42.7878 54.2423 49.5103 47.5199Z" fill="#B3F1BF"/>
  </g>
  <g filter="url(#${filterId}_4)">
    <path d="M22.9212 17.8568C31.0036 25.9393 31.0036 39.0436 22.9212 47.1261C14.8387 55.2087 1.73431 55.2087 -6.34817 47.1261C-14.4307 39.0436 -14.4307 25.9393 -6.34817 17.8568C1.73431 9.7743 14.8387 9.7743 22.9212 17.8568Z" fill="#FFD9E4"/>
  </g>
  <g filter="url(#${filterId}_5)">
    <path d="M49.9845 14.1633C57.3286 6.81914 57.2971 -5.11966 49.9141 -12.5027C42.531 -19.8858 30.5922 -19.9173 23.248 -12.5731C15.9038 -5.22891 15.9353 6.70989 23.3184 14.0929C30.7015 21.476 42.6403 21.5075 49.9845 14.1633Z" fill="#84CFFF"/>
  </g>
  <defs>
    <filter id="${filterId}_0" x="-19.1709" y="-5.36169" width="78.6273" height="78.6273" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
    <filter id="${filterId}_1" x="-19.1709" y="-5.36169" width="78.6273" height="78.6273" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
    <filter id="${filterId}_2" x="-35.9586" y="-37.6139" width="84.8159" height="84.8159" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
    <filter id="${filterId}_3" x="-3.87573" y="-5.86621" width="82.4279" height="82.428" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
    <filter id="${filterId}_4" x="-36.41" y="-12.2051" width="89.3931" height="89.3931" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
    <filter id="${filterId}_5" x="-6.23962" y="-42.0607" width="85.7117" height="85.7115" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur"/>
    </filter>
  </defs>
</svg>`;
};

/**
 * SVG template for filled icon style
 * Based on user-provided example
 */
export const getFilledIconSVG = (size = 'XS') => {
    const sizeMap = {
        XS: { width: 40, height: 40, viewBox: '0 0 40 40' },
        S: { width: 64, height: 64, viewBox: '0 0 40 40' },
        M: { width: 92, height: 92, viewBox: '0 0 40 40' },
        L: { width: 144, height: 144, viewBox: '0 0 40 40' },
        XL: { width: 160, height: 160, viewBox: '0 0 40 40' }
    };
    
    const dimensions = sizeMap[size] || sizeMap.XS;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${dimensions.viewBox}" fill="none">
  <path d="M35.8936 0C38.1614 0.000181403 39.9998 1.8386 40 4.10645V35.8936C39.9998 38.1614 38.1614 39.9998 35.8936 40H4.10645C1.8386 39.9998 0.000181403 38.1614 0 35.8936V4.10645C0.000182433 1.8386 1.8386 0.000182434 4.10645 0H35.8936ZM30.7344 3.69238C30.3946 3.69238 30.1192 3.96782 30.1191 4.30762V7.38477H26.7871C26.4379 7.38477 26.1544 7.6602 26.1543 8V9.23047C26.1544 9.57028 26.4379 9.84668 26.7871 9.84668H30.1191V12.9229C30.1192 13.2627 30.3945 13.5381 30.7344 13.5381H31.9648C32.3044 13.5378 32.58 13.2625 32.5801 12.9229V9.84668H35.6406C35.9895 9.84626 36.2724 9.57002 36.2725 9.23047V8C36.2724 7.66046 35.9895 7.38519 35.6406 7.38477H32.5801V4.30762C32.58 3.96798 32.3044 3.69265 31.9648 3.69238H30.7344Z" fill="#F9F9FC"/>
</svg>`;
};

/**
 * SVG template for outlined icon style
 * Based on user-provided example
 */
export const getOutlinedIconSVG = (size = 'XS') => {
    const sizeMap = {
        XS: { width: 44, height: 44, viewBox: '0 0 44 44' },
        S: { width: 68, height: 68, viewBox: '0 0 44 44' },
        M: { width: 96, height: 96, viewBox: '0 0 44 44' },
        L: { width: 148, height: 148, viewBox: '0 0 44 44' },
        XL: { width: 164, height: 164, viewBox: '0 0 44 44' }
    };
    
    const dimensions = sizeMap[size] || sizeMap.XS;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${dimensions.viewBox}" fill="none">
  <path d="M37.8936 1C40.7137 1.00018 42.9998 3.28631 43 6.10645V37.8936C42.9998 40.7137 40.7137 42.9998 37.8936 43H6.10645C3.28631 42.9998 1.00018 40.7137 1 37.8936V6.10645C1.00018 3.28631 3.28631 1.00018 6.10645 1H37.8936Z" stroke="#F9F9FC" stroke-width="2"/>
  <path d="M33.9644 5.69226C34.3042 5.69226 34.5795 5.9677 34.5796 6.3075V9.38464H37.6401C37.9892 9.38481 38.2719 9.66018 38.272 9.99988V11.2303C38.272 11.5701 37.9893 11.8464 37.6401 11.8466H34.5796V14.9227C34.5796 15.2626 34.3042 15.538 33.9644 15.538H32.7339C32.394 15.538 32.1187 15.2626 32.1187 14.9227V11.8466H28.7866C28.4374 11.8466 28.1538 11.5702 28.1538 11.2303V9.99988C28.1539 9.66008 28.4374 9.38464 28.7866 9.38464H32.1187V6.3075C32.1187 5.9677 32.3941 5.69226 32.7339 5.69226H33.9644Z" fill="#F9F9FC"/>
</svg>`;
};

/**
 * SVG template for text wordmark (colored style)
 * Based on user-provided example
 */
export const getTextWordmarkSVG = (size = 'XS', style = 'colored') => {
    const sizeMap = {
        XS: { width: 99, height: 32, viewBox: '0 0 99 32' },
        S: { width: 172, height: 64, viewBox: '0 0 99 32' },
        M: { width: 246, height: 92, viewBox: '0 0 99 32' },
        L: { width: 394, height: 144, viewBox: '0 0 99 32' },
        XL: { width: 443, height: 160, viewBox: '0 0 99 32' }
    };
    
    const dimensions = sizeMap[size] || sizeMap.XS;
    const fillColor = style === 'colored' ? '#3F484A' : '#F9F9FC';
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${dimensions.viewBox}" fill="none">
  <path d="M9.31106 0.447106C13.4444 0.447106 16.4605 1.27035 18.3592 2.91683C20.258 4.56332 21.2073 6.86982 21.2073 9.83633C21.2073 11.1847 20.9882 12.4693 20.5501 13.69C20.1265 14.8964 19.4254 15.9681 18.4469 16.9049C17.4683 17.8275 16.1757 18.5584 14.5691 19.0978C12.9771 19.6372 11.0126 19.9069 8.67572 19.9069H5.25801V31.5742H0V0.447106H9.31106ZM8.96053 4.68397H5.25801V15.6487H8.12801C9.77844 15.6487 11.1806 15.4642 12.3344 15.0951C13.4883 14.7119 14.3646 14.1087 14.9634 13.2854C15.5623 12.4622 15.8617 11.3764 15.8617 10.0279C15.8617 8.22533 15.2994 6.88401 14.1747 6.00399C13.0647 5.12397 11.3266 4.68397 8.96053 4.68397Z" fill="${fillColor}"/>
  <path d="M25.8098 31.5742V0.447106H31.0678V27.2309H44.6729V31.5742H25.8098Z" fill="${fillColor}"/>
  <path d="M73.5719 0.447106V20.5882C73.5719 22.7598 73.0972 24.7044 72.1478 26.4218C71.2131 28.1393 69.7963 29.5019 67.8976 30.5096C65.9989 31.5032 63.6108 32 60.7335 32C56.6294 32 53.5038 30.9568 51.3568 28.8703C49.2243 26.7696 48.1581 23.9805 48.1581 20.503V0.447106H53.4161V20.0559C53.4161 22.6534 54.0442 24.5695 55.3003 25.8044C56.5563 27.0393 58.4332 27.6567 60.9307 27.6567C62.6542 27.6567 64.0563 27.3657 65.1371 26.7838C66.2325 26.1876 67.0359 25.3218 67.5471 24.1863C68.0729 23.0366 68.3358 21.6527 68.3358 20.0346V0.447106H73.5719Z" fill="${fillColor}"/>
  <path d="M98.4615 23.1005C98.4615 24.9457 97.9942 26.5354 97.0594 27.8696C96.1392 29.2038 94.8101 30.2258 93.0721 30.9355C91.3486 31.6452 89.2892 32 86.8939 32C85.7255 32 84.6081 31.9361 83.5419 31.8084C82.4757 31.6806 81.4679 31.4961 80.5186 31.2548C79.5838 30.9993 78.7294 30.6942 77.9553 30.3393V25.5276C79.2552 26.0812 80.7084 26.5851 82.3151 27.0393C83.9217 27.4793 85.5575 27.6993 87.2225 27.6993C88.5809 27.6993 89.7055 27.5289 90.5964 27.1883C91.502 26.8334 92.1738 26.3367 92.612 25.6979C93.0502 25.045 93.2692 24.2857 93.2692 23.4198C93.2692 22.4972 93.0137 21.7166 92.5025 21.0778C91.9913 20.4391 91.2172 19.8572 90.1802 19.332C89.1578 18.7926 87.8725 18.2178 86.3243 17.6075C85.2727 17.1958 84.2649 16.7274 83.3009 16.2023C82.3516 15.6771 81.5044 15.0597 80.7596 14.35C80.0147 13.6403 79.4231 12.8028 78.985 11.8377C78.5614 10.8583 78.3496 9.70858 78.3496 8.38856C78.3496 6.62852 78.7805 5.12397 79.6422 3.87492C80.5186 2.62586 81.7454 1.66778 83.3228 1.00067C84.9149 0.333555 86.7698 0 88.8876 0C90.5672 0 92.1446 0.170326 93.6198 0.510978C95.1096 0.85163 96.5701 1.33422 98.0015 1.95875L96.3364 6.06786C95.0219 5.54269 93.7439 5.12397 92.5025 4.81171C91.2756 4.49945 90.0195 4.34331 88.7342 4.34331C87.6242 4.34331 86.6821 4.50654 85.908 4.833C85.1339 5.15946 84.5424 5.62076 84.1335 6.2169C83.7391 6.79885 83.5419 7.49434 83.5419 8.30339C83.5419 9.2118 83.7683 9.97827 84.2211 10.6028C84.6885 11.2131 85.4041 11.7738 86.3681 12.2848C87.3467 12.7957 88.6028 13.3635 90.1363 13.988C91.9036 14.6977 93.4007 15.4429 94.6276 16.2236C95.869 17.0042 96.8184 17.941 97.4757 19.0339C98.1329 20.1127 98.4615 21.4682 98.4615 23.1005Z" fill="${fillColor}"/>
</svg>`;
};
