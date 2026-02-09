import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  FlatList,
  ScrollView,
  SectionList,
} from 'react-native';
import type {
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps,
  SectionListProps,
} from 'react-native';
import { NativeMarfeelSdk } from '../NativeMarfeelSdk';

type ScrollableComponent =
  | typeof ScrollView
  | typeof FlatList
  | typeof SectionList;

type CompassScrollViewProps<T extends ScrollableComponent = typeof ScrollView> =
  T extends typeof FlatList
    ? FlatListProps<unknown> & { as: typeof FlatList }
    : T extends typeof SectionList
      ? SectionListProps<unknown> & { as: typeof SectionList }
      : ScrollViewProps & { as?: typeof ScrollView };

type BaseProps = {
  as?: ScrollableComponent;
} & ScrollViewProps;

const CompassScrollViewInner = forwardRef<
  ScrollView | FlatList | SectionList,
  BaseProps
>(function CompassScrollViewInner(props, ref) {
  const { as: Component = ScrollView, onScroll: userOnScroll, ...rest } = props;
  const innerRef = useRef<ScrollView | FlatList | SectionList>(null);

  useImperativeHandle(ref, () => innerRef.current as ScrollView);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollableHeight = contentSize.height - layoutMeasurement.height;
      if (scrollableHeight > 0) {
        const percentage = Math.round((contentOffset.y / scrollableHeight) * 100);
        NativeMarfeelSdk.updateScrollPercentage(percentage);
      }
      if (userOnScroll) {
        (userOnScroll as (event: NativeSyntheticEvent<NativeScrollEvent>) => void)(event);
      }
    },
    [userOnScroll]
  );

  const ScrollableElement = Component as typeof ScrollView;
  return (
    <ScrollableElement
      ref={innerRef as React.Ref<ScrollView>}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      {...(rest as ScrollViewProps)}
    />
  );
});

export const CompassScrollView = CompassScrollViewInner as <
  T extends ScrollableComponent = typeof ScrollView,
>(
  props: CompassScrollViewProps<T> & { ref?: React.Ref<ScrollView> }
) => React.ReactElement;
