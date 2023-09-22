[@sitecore-jss/sitecore-jss-react](../README.md) / DateFieldProps

# Interface: DateFieldProps

## Indexable

▪ [htmlAttributes: `string`]: `unknown`

## Table of contents

### Properties

- [editable](DateFieldProps.md#editable)
- [field](DateFieldProps.md#field)
- [render](DateFieldProps.md#render)
- [tag](DateFieldProps.md#tag)

## Properties

### editable

• `Optional` **editable**: `boolean`

Can be used to explicitly disable inline editing.
If true and `field.editable` has a value, then `field.editable` will be processed and rendered as component output. If false, `field.editable` value will be ignored and not rendered.

**`Default`**

true

#### Defined in

[sitecore-jss-react/src/components/Date.tsx:20](https://github.com/Sitecore/jss/blob/19e6229c3/packages/sitecore-jss-react/src/components/Date.tsx#L20)

---

### field

• **field**: `Object`

#### Type declaration

| Name        | Type     |
| :---------- | :------- |
| `editable?` | `string` |
| `value?`    | `string` |

#### Defined in

[sitecore-jss-react/src/components/Date.tsx:7](https://github.com/Sitecore/jss/blob/19e6229c3/packages/sitecore-jss-react/src/components/Date.tsx#L7)

---

### render

• `Optional` **render**: (`date`: `Date`) => `ReactNode`

#### Type declaration

▸ (`date`): `ReactNode`

##### Parameters

| Name   | Type   |
| :----- | :----- |
| `date` | `Date` |

##### Returns

`ReactNode`

#### Defined in

[sitecore-jss-react/src/components/Date.tsx:21](https://github.com/Sitecore/jss/blob/19e6229c3/packages/sitecore-jss-react/src/components/Date.tsx#L21)

---

### tag

• `Optional` **tag**: `string`

The HTML element that will wrap the contents of the field.

#### Defined in

[sitecore-jss-react/src/components/Date.tsx:14](https://github.com/Sitecore/jss/blob/19e6229c3/packages/sitecore-jss-react/src/components/Date.tsx#L14)
