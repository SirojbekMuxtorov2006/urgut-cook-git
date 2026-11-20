import React from 'react';
import type { FoodArtworkType } from '../data/catalog';

interface Props {
  type: FoodArtworkType;
  className?: string;
}

/**
 * Clean, high-contrast vector dish illustrations tailored for the teal product cards
 * from the POS reference design.
 */
export function FoodArtwork({ type, className = 'w-14 h-14' }: Props) {
  switch (type) {
    case 'plov':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <ellipse cx="32" cy="46" rx="24" ry="8" fill="#FFFFFF" fillOpacity="0.95" />
          <path d="M12 43C14 31 22 25 32 25C42 25 50 31 52 43H12Z" fill="#F5C065" />
          <path d="M18 41C21 33 26 29 32 29C38 29 43 33 46 41H18Z" fill="#FDE09B" />
          <circle cx="26" cy="36" r="3" fill="#B45309" />
          <circle cx="36" cy="34" r="3.2" fill="#92400E" />
          <circle cx="31" cy="40" r="2.6" fill="#D97706" />
          <path d="M22 38L28 35M35 38L42 36" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="32" cy="23" r="3.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
          <path d="M10 46C10 51 20 54 32 54C44 54 54 51 54 46" stroke="#E2E8F0" strokeWidth="2" />
        </svg>
      );
    case 'lagman':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M10 34H54C54 46 44 53 32 53C20 53 10 46 10 34Z" fill="#FFFFFF" />
          <ellipse cx="32" cy="34" rx="22" ry="6" fill="#FDE68A" />
          <path d="M16 33C22 29 27 36 33 32C39 28 44 35 48 32" stroke="#D97706" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M18 36C24 33 29 38 35 35C41 32 45 37 47 35" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="32" r="2.8" fill="#DC2626" />
          <circle cx="38" cy="33" r="2.8" fill="#16A34A" />
          <path d="M24 23C24 19 27 19 27 15M33 22C33 18 36 18 36 14M41 23C41 19 44 19 44 15" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'manti':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <ellipse cx="32" cy="48" rx="23" ry="7" fill="#FFFFFF" fillOpacity="0.95" />
          <path d="M15 44C15 35 20 31 25 31C30 31 35 35 35 44H15Z" fill="#FEF3C7" stroke="#E5C07B" strokeWidth="1.5" />
          <path d="M29 44C29 35 34 31 39 31C44 31 49 35 49 44H29Z" fill="#FFFBEB" stroke="#E5C07B" strokeWidth="1.5" />
          <path d="M22 46C22 37 27 33 32 33C37 33 42 37 42 46H22Z" fill="#FEF9C3" stroke="#D97706" strokeWidth="1.5" />
          <path d="M28 37L32 34L36 37" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="32" cy="41" r="1.5" fill="#16A34A" />
          <circle cx="25" cy="39" r="1.5" fill="#16A34A" />
          <circle cx="39" cy="39" r="1.5" fill="#16A34A" />
        </svg>
      );
    case 'kabob':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <ellipse cx="32" cy="46" rx="24" ry="8" fill="#FFFFFF" />
          <rect x="16" y="31" width="14" height="10" rx="4" fill="#92400E" />
          <rect x="28" y="28" width="16" height="11" rx="4.5" fill="#78350F" />
          <rect x="36" y="34" width="13" height="9" rx="4" fill="#B45309" />
          <circle cx="21" cy="41" r="4.5" fill="#FBBF24" />
          <circle cx="30" cy="42" r="4.5" fill="#F59E0B" />
          <circle cx="44" cy="41" r="4" fill="#FBBF24" />
          <path d="M20 34L26 37M32 31L39 35" stroke="#FEF3C7" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="48" cy="33" r="3" fill="#22C55E" />
        </svg>
      );
    case 'soup':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M11 33H53C53 45 44 53 32 53C20 53 11 45 11 33Z" fill="#FFFFFF" />
          <ellipse cx="32" cy="33" rx="21" ry="6" fill="#F97316" />
          <ellipse cx="32" cy="33" rx="17" ry="4" fill="#FB923C" />
          <circle cx="25" cy="33" r="2.6" fill="#FEF08A" />
          <circle cx="36" cy="32" r="3" fill="#92400E" />
          <circle cx="31" cy="35" r="2" fill="#22C55E" />
          <path d="M25 22C25 18 28 18 28 14M34 21C34 17 37 17 37 13" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'shashlik':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <line x1="11" y1="50" x2="53" y2="14" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
          <rect x="17" y="34" width="11" height="9" rx="3" transform="rotate(-40 17 34)" fill="#78350F" />
          <rect x="27" y="25" width="11" height="9" rx="3" transform="rotate(-40 27 25)" fill="#92400E" />
          <rect x="37" y="16" width="11" height="9" rx="3" transform="rotate(-40 37 16)" fill="#B45309" />
          <circle cx="27" cy="35" r="3" fill="#EF4444" />
          <circle cx="37" cy="26" r="3" fill="#FDE047" />
        </svg>
      );
    case 'salad':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M12 36H52C50 47 42 53 32 53C22 53 14 47 12 36Z" fill="#FFFFFF" />
          <circle cx="22" cy="33" r="7" fill="#22C55E" />
          <circle cx="33" cy="29" r="8" fill="#4ADE80" />
          <circle cx="43" cy="33" r="7" fill="#16A34A" />
          <circle cx="27" cy="34" r="4" fill="#EF4444" />
          <circle cx="38" cy="34" r="4" fill="#DC2626" />
          <circle cx="33" cy="31" r="2.5" fill="#FEF08A" />
        </svg>
      );
    case 'somsa':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <ellipse cx="32" cy="48" rx="22" ry="6" fill="#FFFFFF" fillOpacity="0.92" />
          <path d="M32 18L51 45H13L32 18Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
          <path d="M32 23L46 43H18L32 23Z" fill="#FBBF24" />
          <circle cx="32" cy="33" r="1.4" fill="#78350F" />
          <circle cx="28" cy="38" r="1.4" fill="#78350F" />
          <circle cx="36" cy="38" r="1.4" fill="#78350F" />
          <circle cx="32" cy="39" r="1.2" fill="#FEF3C7" />
        </svg>
      );
    case 'bread':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <circle cx="32" cy="34" r="19" fill="#F59E0B" stroke="#D97706" strokeWidth="2.5" />
          <circle cx="32" cy="34" r="11" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="32" cy="34" r="2" fill="#92400E" />
          <circle cx="27" cy="31" r="1.3" fill="#92400E" />
          <circle cx="37" cy="31" r="1.3" fill="#92400E" />
          <circle cx="27" cy="37" r="1.3" fill="#92400E" />
          <circle cx="37" cy="37" r="1.3" fill="#92400E" />
        </svg>
      );
    case 'tea':
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M18 30C18 23 24 20 32 20C40 20 46 23 46 30V43C46 47 41 50 32 50C23 50 18 47 18 43V30Z" fill="#FFFFFF" />
          <path d="M46 29C51 29 53 32 53 36C53 40 50 42 46 42" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M18 33L11 27" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="32" cy="22" rx="9" ry="3.5" fill="#CCFBF1" />
          <circle cx="32" cy="17" r="3" fill="#FFFFFF" />
          <path d="M25 36C29 33 35 33 39 36" stroke="#0F9D8A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'drink':
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
          <path d="M22 22H42L39 52H25L22 22Z" fill="#FFFFFF" />
          <path d="M23.5 29H40.5L38.3 49H25.7L23.5 29Z" fill="#F97316" />
          <rect x="20" y="19" width="24" height="4" rx="2" fill="#E2E8F0" />
          <path d="M35 19L39 10L45 10" stroke="#FEF08A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="29" cy="36" r="2.2" fill="#FFFFFF" fillOpacity="0.7" />
          <circle cx="35" cy="41" r="2.5" fill="#FFFFFF" fillOpacity="0.7" />
        </svg>
      );
  }
}
