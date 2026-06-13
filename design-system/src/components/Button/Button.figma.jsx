/**
 * Code Connect — Tonal buttons component set (Figma node 979:20977).
 */
import figma from '@figma/code-connect/react';
import Button from './Button';

figma.connect(
  Button,
  'https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4-Foundation--Component-LIbrary-?node-id=979-20977',
  {
    props: {
      text: figma.textContent('Label'),
      style: figma.enum('style', {
        primary: 'primary',
        secondary: 'secondary',
        tertiary: 'tertiary',
        success: 'success',
        warning: 'warning',
        danger: 'danger',
        info: 'info',
        default: 'default',
        'social-emotional': 'social-emotional',
        'mastering-content': 'mastering-content',
        advocacy: 'advocacy',
        relationship: 'relationship',
        'technology-tools': 'technology-tools',
      }),
      size: figma.enum('size', {
        small: 'small',
        'medium (default)': 'medium',
        large: 'large',
      }),
      disabled: figma.enum('state', {
        disabled: true,
        'rest (default)': false,
        hover: false,
        pressed: false,
        focus: false,
      }),
    },
    example: ({ text, style, size, disabled }) => (
      <Button
        text={text}
        style={style}
        size={size}
        fill="tonal"
        disabled={disabled}
      />
    ),
  }
);
