export function updateArrayValue<T>(
  arr: Array<T>,
  val: T,
  predicate ?: (arg: T) => boolean
) : Array<T> {
    const idx = predicate
      ? arr.findIndex(predicate)
      : arr.indexOf(val);

    return [
      ...arr.slice(0, idx),
      val,
      ...arr.slice(idx + 1),
    ];
}
