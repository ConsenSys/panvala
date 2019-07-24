import * as React from 'react';
import Text from './system/Text';

export default function SlateSectionLabel({ text }: any) {
  return (
    <Text ml={3} mt={4} fontSize="0.75rem" fontWeight="bold">
      {text}
    </Text>
  );
}
