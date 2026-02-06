import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  FlatList,
  findNodeHandle,
  ScrollView,
  SectionList,
} from 'react-native';
import type {
  FlatListProps,
  ScrollViewProps,
  SectionListProps,
} from 'react-native';

type ScrollableComponent =
  | typeof ScrollView
  | typeof FlatList
  | typeof SectionList;

let activeScrollViewTag: number | null = null;

export function getActiveScrollViewTag(): number | null {
  return activeScrollViewTag;
}

export function clearActiveScrollViewTag(): void {
  activeScrollViewTag = null;
}

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
  const { as: Component = ScrollView, ...rest } = props;
  const innerRef = useRef<ScrollView | FlatList | SectionList>(null);

  useImperativeHandle(ref, () => innerRef.current as ScrollView);

  useEffect(() => {
    if (innerRef.current) {
      activeScrollViewTag = findNodeHandle(innerRef.current);
    }
    return () => {
      activeScrollViewTag = null;
    };
  }, []);

  const ScrollableElement = Component as typeof ScrollView;
  return <ScrollableElement ref={innerRef as React.Ref<ScrollView>} {...(rest as ScrollViewProps)} />;
});

export const CompassScrollView = CompassScrollViewInner as <
  T extends ScrollableComponent = typeof ScrollView,
>(
  props: CompassScrollViewProps<T> & { ref?: React.Ref<ScrollView> }
) => React.ReactElement;
