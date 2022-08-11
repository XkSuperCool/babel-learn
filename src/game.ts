type Split<
  T extends string,
  F extends string,
  Arr extends unknown[] = []
> = T extends `${infer S}${F}${infer R}`
  ? Split<R, F, [...Arr, S]>
  : [...Arr, T]

type Join<
  T extends unknown[],
  F extends string,
  S extends string = ''
> = T extends [infer E, ...infer Rest]
  ? Join<Rest, F, `${S}${S extends '' ? '' : F}${E & string}`>
  : S

type Splice<
  T extends unknown[],
  Index extends number,
  V,
  CurIndex extends number = 0,
  Arr extends unknown[] = []
> = T extends [infer F, ...infer Rest]
  ? CurIndex extends Index
    ? Splice<Rest, Index, V, Add<CurIndex, 1> & number, [...Arr, V]>
    : Splice<Rest, Index, V, Add<CurIndex, 1> & number, [...Arr, F]>
  : Arr

type Values<T> = T extends { [K in keyof any]: infer V } ? V : never

type BuildArray<
  Len extends number,
  Arr extends unknown[] = []
> = Arr['length'] extends Len ? Arr : BuildArray<Len, [...Arr, unknown]>

type Add<A extends number, B extends number> = [
  ...BuildArray<A>,
  ...BuildArray<B>
]['length']

type Sub<A extends number, B extends number> = BuildArray<A> extends [
  ...BuildArray<B>,
  ...infer Rest
]
  ? Rest['length']
  : never

type Position = 1 | 2 | 3
type Down<
  X extends Position,
  Y extends Position,
  P extends ChessBoardType,
  C extends Chess
> = IsWin<P, ChessX> extends true
  ? `${ChessX} 胜利, 游戏结束`
  : IsWin<P, ChessO> extends true
  ? `${ChessO} 胜利, 游戏结束`
  : {
      [K in keyof P]: X extends K
        ? Join<Splice<Split<P[K] & string, ' '>, Sub<Y, 1>, C>, ' '>
        : P[K]
    }

type IsHorizontalWin<T, C extends Chess> = {} extends {
  [K in keyof T as T[K] extends `${C} ${C} ${C}` ? K : never]: true
}
  ? false
  : true

type IsVerticalWin<
  T extends ChessBoardType,
  C extends Chess,
  U extends unknown[] = Values<{
    [K in keyof T]: Split<T[K] & string, ' '>
  }>,
  Index = 0 | 1 | 2
> = (
  Index extends any
    ? (
        U extends any ? (U[Index & number] extends C ? true : false) : never
      ) extends true
      ? true
      : false
    : never
) extends false
  ? false
  : true

type IsSkewWin<
  T extends ChessBoardType,
  C extends Chess,
  M extends 'LR' | 'RL',
  Index extends number[] = M extends 'LR' ? [0, 1, 2] : [2, 1, 0]
> = Values<{
  [K in keyof T]: Split<T[K] & string, ' '>[Index[Sub<K & number, 1>]]
}> extends C
  ? true
  : false

type IsWin<T extends ChessBoardType, C extends Chess> =
  | IsVerticalWin<T, C>
  | IsHorizontalWin<T, C>
  | IsSkewWin<T, C, 'LR'>
  | IsSkewWin<T, C, 'RL'> extends false
  ? false
  : true

type ChessX = '❌'
type ChessO = '⭕️'
type Chess = ChessX | ChessO

type ChessBoardType<T extends string = string> = Record<
  1 | 2 | 3,
  `${T} ${T} ${T}`
>

type DefaultChessBoard = ChessBoardType<'[]'>

// ChessX 获胜
type ChessBoard2 = Down<1, 2, DefaultChessBoard, ChessX>
type ChessBoard3 = Down<2, 1, ChessBoard2, ChessO>
type ChessBoard4 = Down<2, 2, ChessBoard3, ChessX>
type ChessBoard5 = Down<1, 1, ChessBoard4, ChessO>
type ChessBoard6 = Down<3, 2, ChessBoard5, ChessX>
type ChessBoard7 = Down<3, 1, ChessBoard6, ChessO>

// ChessO 获胜
type ChessBoard8 = Down<1, 2, DefaultChessBoard, ChessO>
type ChessBoard9 = Down<2, 1, ChessBoard8, ChessX>
type ChessBoard10 = Down<2, 2, ChessBoard9, ChessO>
type ChessBoard11 = Down<1, 1, ChessBoard10, ChessX>
type ChessBoard12 = Down<3, 2, ChessBoard11, ChessO>
type ChessBoard13 = Down<3, 1, ChessBoard12, ChessX>

// 连成斜线
type ChessBoard14 = Down<1, 1, DefaultChessBoard, ChessX>
type ChessBoard15 = Down<2, 1, ChessBoard14, ChessO>
type ChessBoard16 = Down<2, 2, ChessBoard15, ChessX>
type ChessBoard17 = Down<2, 3, ChessBoard16, ChessO>
type ChessBoard18 = Down<3, 3, ChessBoard17, ChessX>
type ChessBoard19 = Down<3, 1, ChessBoard18, ChessO>
