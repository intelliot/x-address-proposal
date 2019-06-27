# X Addresses

## Note: This is a draft for discussion, and should not be implemented yet.

Only 1 tagged address standard should ultimately be adopted.

```
XRP Ledger Proposed Standard #5-L

Title:       Extended Addresses (X Addresses) - a "loosely" packed tagged address format
Author:      Elliot M. Lee
Affiliation: Ripple
Status:      Draft
Created:     2019-06-18
```

## Abstract

Destination tags provide a way for exchanges, payment processors, corporates or entities which accept incoming payments, escrows, checks and similar transactions to use a single receiving account (wallet) while being able to disambiguate incoming transactions by instructing the senders to include a destination tag.

The Extended Address, or X Address, is a way to encode the target account and the destination tag as a single unit.

This format also encodes two other values:

- A network ID indicating whether the address is intended for use in production or in test.
- An optional expiration to be enforced by client software.

Conveniently, when intended for use with the production XRP Ledger, addresses encoded in this format are defined to start with the letter X. This reduces the learning curve since X addresses will be immediately identifiable, even by users who are encountering them for the first time.

## Proposal

### Addresses and Destination Tags

For a better introduction to addresses and tags, it may help to reference https://developers.ripple.com/accounts.html.

The address that identifies an Account in the XRP Ledger is consistently referred to as a "classic address" in this document. It can also be referred to as an "account address".

### Legacy Format

An account address is formed by base58-encoding (with a checksum) a 21 byte buffer:

`[← 1 byte prefix →|← 160 bits of account ID →]`

The chosen byte prefix is `TokenType::AccountID` (value 0)

This base58-encoded string is referred to as a "classic address". This address does not include a destination tag, which needs to be communicated separately. There are a variety of ways to do this. One option is to separate the classic address and destination tag with a colon, like so: `rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf:276`.

### X Address Format

This format combines five items together. Note that the following is not a buffer to be encoded, but a representation of the final Extended Address itself:

`[← 1 network ID →|← encode(required checksum + optional expiration) →|0|← tag →|← classic address →]`

The following values are concatenated together:

1. The **initial character** indicating the network where this address can be used: `X` for production or `T` for test.
2. The **required checksum and optional expiration timestamp** encoded in base58.
3. The **separator**, which is always "0". [[1](#why-include-a-separator-in-addresses)]
4. The **tag**.
5. The **classic address**.

#### 1. Network ID

This character is chosen to be `X` for production and `T` for test. These choices are arbitrary, but uppercase letters help to distinguish these addresses from existing addresses. They also look like a proper noun. `X` also forms a parallel with the name of the system (`XRP Ledger`).

#### 2. Base58-encoded Value

The base58-encoded value contains a required checksum and an optional expiration timestamp.

The timestamp is expressed in [the same way as time in the XRP Ledger](https://xrpl.org/basic-data-types.html#specifying-time), with a 32-bit unsigned integer measuring the number of seconds since the XRP Ledger "epoch" of January 1, 2000 (00:00 UTC).

The checksum is calculated in a similar manner to a classic address's checksum, but note that is a checksum over _all_ of the data represented by the extended address.

The checksum is calculated with the following steps.
1. Decode the account ID from the classic address.
2. Encode the expiration as a little endian 32-bit unsigned integer. If the address does not expire, encode this as zero bytes (effectively omitting it in step 5).
3. Encode the tag as a little endian 32-bit unsigned integer. If no tag should be used, encode this as zero bytes (effectively omitting it in step 5).
4. Encode the network ID character as one byte. Since the only network IDs are 'X' and 'T', `utf8` and `ascii` encoding yield the same result.
5. Concatenate these values in the following order: `Buffer.concat([networkByte, expirationBuffer, tagBuffer, accountID])`
6. Run the data through a double SHA256 hash. The checksum is the first 4 bytes.

Encode the expiration with the checksum, in base58. Put the checksum first.

```ts
codec.encode(Buffer.concat([checksum, expirationBuffer]));
```

By placing the checksum first in the data to be encoded, we induce any change to the address/tag/network/expiration to change the first several characters of the resulting address—usually the 4-6 characters after the initial X or T. This aids visual identification of the address, and is a security benefit as well. Consider smaller embedded screens, where users have to horizontally scroll (or wait) to see the entire address. If you have an identical prefix despite different destination tags, it would be easier for an attacker to trick a user into sending funds to an unintended destination. This can occur if users fail to verify both the beginning and the end of the string. With the X address format, verifying the first ~6 characters of the string should be sufficient to thwart most attacks of this type.

By instinct, many people use the shortcut of only verifying the first few and last few characters of an address. With this format, with the checksum at the beginning, this is sufficient for most use cases.

#### 3. Separator

The separator prevents ambiguity between the checksum and the tag, simplifying parsing.

#### 4. Tag

The tag is included as-is, converted to a string. For example, a tag of `16781933` becomes "16781933" inside the resulting X address. This makes parsing simple, and aids user recognition, improving the UX.

64-bit tags can be supported by including them as-is (in decimal format, the same way that 32-bit tags are represented).

If no tag should be used, this section is omitted from the X address.

#### 5. Classic address

The classic address is included as-is. As a result, the account ID is 'checked' by two different checksums. Practically, this redundancy is harmless, and also benefits users and developers by reinforcing the 1:1 correspondence between an X address's account ID and a classic address.

### Encoding Examples

In the following table, we present how the classic address `rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf` would be encoded under this spec to include various destination tags, with an expiration date of 2019-12-31T23:59:59. The tag, if any, is on the left most column, followed by the extended address. The network ID of these extended addresses implies that they are intended for use in production.

{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production 2019-12-31T23:59:59}

In the following table, we present extended address encodings for the same classic address (`rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf`) and expiration (2019-12-31T23:59:59) but with a network ID of 'test' to show the example of extended addresses intended for use on the XRP Ledger Test Net.

{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various test 2019-12-31T23:59:59}

The tables above (and below) are generated by [./src/tablegen.ts](./src/tablegen.ts).

The command line utility included with this proposal can also be used to generate the above examples:
```
./bin/x-address-macos rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf undefined test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 0 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 1 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 2 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 32 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 276 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 65591 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 16781933 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 4294967294 test 2019-12-31T23:59:59 rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 4294967295 test 2019-12-31T23:59:59
```

#### Expiration is optional

Extended addresses do not need to have an expiration. Here are the same classic address and tag encodings, but with no expiration:

{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various production undefined}

{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf various test undefined}

### Transaction Example

Consider the following transaction submission:

```
rippled submit secret '{
    "TransactionType":"Payment",
    "Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV",
    "Amount":"200000000",
    "Destination":"XpwjJ430276rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf"
}'
```

The server would unpack `XpwjJ430276rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf` to `rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf` and a destination tag of 276, and process the submission as if it had been:

```
rippled submit secret '{
    "TransactionType":"Payment",
    "Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV",
    "Amount":"200000000",
    "Destination":"rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
    "DestinationTag":276
}'
```

Obviously the server cannot do this when presented with a pre-signed transaction, although assembling and signing a transaction using an unexpanded packed address shouldn't be possible, since the binary encoding of an AccountID requires exactly 20 bytes.

Third party tools that accept user input should allow users to enter such addresses and transparently expand them prior to signing and/or submitting.

## Sample TypeScript/JavaScript Implementation

The following is an example of a TypeScript function which will encode an Extended Address in a way that complies with this specification:

```ts
// 1. Decode classicAddress to accountID
const accountID: Buffer = decodeAccountID(this.classicAddress);

// 2. Encode networkID
let myNetworkByte: Buffer;
if (this.networkID === 'production') {
  myNetworkByte = Buffer.from('X');
} else if (this.networkID === 'test') {
  myNetworkByte = Buffer.from('T');
} else {
  throw new Error(`Invalid networkID: ${this.networkID}`);
}
const networkByte = myNetworkByte;

// 3. Convert tag to Buffer (UInt32LE)
let myTagBuffer: Buffer;
if (this.tag !== undefined) {
  if (Number.isInteger(this.tag) === false) {
    throw new Error(`Invalid tag: ${this.tag}`);
  }
  myTagBuffer = Buffer.alloc(8); // 8 bytes = 64 bits
  myTagBuffer.writeUInt32LE(this.tag, 0);
} else {
  myTagBuffer = Buffer.alloc(0);
}
const tagBuffer: Buffer = myTagBuffer;

// 4. Convert expiration to Buffer (UInt32LE)
let myExpirationBuffer: Buffer;
if (this.expiration !== undefined) {
  if (Number.isInteger(this.expiration) === false) {
    throw new Error(`Invalid expiration: ${this.expiration}`);
  }
  myExpirationBuffer = Buffer.alloc(4); // 4 bytes = 32 bits
  myExpirationBuffer.writeUInt32LE(this.expiration, 0);
} else {
  myExpirationBuffer = Buffer.alloc(0); // no expiration
}
const expirationBuffer: Buffer = myExpirationBuffer;

// 5. Concat networkByte, expirationBuffer, tagBuffer, and accountID
//    to create the payload to be checksummed.
//    NB: The ordering of these values has been changed from an earlier draft of this spec.
const payload = Buffer.concat([networkByte, expirationBuffer, tagBuffer, accountID]);

// 6. SHA256 x 2 and take first 4 bytes as checksum
const checksum = sha256(sha256(payload)).slice(0, 4);

// 7. Encode the expiration with the checksum, in base58.
//    NB: Put the checksum first so that any change to the address/tag/network/expiration
//        changes the first several characters of the resulting address.
const checksumAndExpirationBase58 = codec.encode(Buffer.concat([checksum, expirationBuffer]));

// 8. Use '0' as a separator
const SEPARATOR = '0';

// 9. Form the "X Address" and return it:
//    - Start with 'X' or 'T' to make the address format obvious;
//    - Lead with the checksum so that any (valid) change to the
//      address/tag/network/expiration changes the first several characters of
//      the resulting address;
//    - Append the tag next for easy parsing.
//      To get the tag, take everything between SEPARATOR and 'r'
//      (since a classic address will always start with 'r').
//      Notice that if we had put the tag after the address, we would
//      need to add a second separator to avoid ambiguity: the numbers
//      1-9 are all valid base58 characters in our alphabet.
//      An added benefit of this approach is that the tag, in the middle
//      of the string, (correctly) appears to be opaque and not user-editable.
//    - Finish with the classic address.
const tagString = this.tag !== undefined ? this.tag.toString() : '';
return new XAddress(networkByte.toString() + checksumAndExpirationBase58 + SEPARATOR + tagString + this.classicAddress);
```

This requires some supporting code; please [view the full implementation here](./src/x-address.ts).

To run the example (requires node.js and npm):

1. Clone this git repo
2. Run `npm install`
2. Run `npm run compile`
3. Run `node . ADDRESS [TAG] [NETWORK ID]`

Try:

```
node . Xscra3e00rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf
```

```
node . rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 0 production
```

To encode an address that should not use a tag and/or have an expiration, substitute `undefined` for the tag and/or expiration respectively. Similarly, Extended Addresses without a tag and/or expiration will, when converted to legacy address format by this tool, show `undefined` for the tag and/or expiration as expected. The utility supports converting multiple addresses at once; separate addresses with a space.

You can also build binaries for Linux, Mac OS X, and Microsoft Windows: `npm run build`

Binaries will be output in the `./bin` directory.

# Rationale

The following sections describe the reasoning behind why and how this format was devised.

## Motivation

Although flexible, destination tags suffer from several drawbacks. The tag is an opaque identifier, generated by and meaningful only to the entity that will be receiving funds.

Communicating a destination tag to users can be a problem for a number of reasons:

- In the absence of a standard format to represent an (address, tag) pair, different users of destination tags communicate the information in different ways.
- A user needs to enter two items, usually in two distinct input fields which may be inconsistently or confusingly named (e.g. one implementation refers to the destination tag as a "PIN").
- Programmers need to decide on how, when or even if the "Destination Tag" field must be surfaced, complicating panel layouts and increasing the potential for user confusion.
- Tags do not include a checksum to prevent against a user accidentally omitting or transposing digits or otherwise incorrectly entering a tag.
- There is often no indication if a tag was originally provided and it was missed or lost.

This proposal seeks to address this problem by defining a standard format to represent an (address, tag) which:

- Is expressed as a single string that shares all the desirable properties of existing addresses, including the ability to be selected by double-clicking on them.
- Eliminates the need for a separate "Destination Tag" field by allowing a single format to represent addresses both with and without tags.
- Includes a built-in checksum as a form of error-checking to reduce the probability that a typographical error will generate a correct address.

Furthermore, this new format distinguishes between production (aka mainnet) and test (aka test net or altnet); and adds an optional expiration, discussed in the next section.

### Motivation for expiration

Destination tags are 32-bit unsigned integers, so the maximum value is 2^32 - 1, or 4294967295. While this is a decent amount of granularity, it is not, for instance, enough to give each human on Earth a unique destination tag. Furthermore, using sequential tags (or auto-incremented ones) is not ideal because they are public values permanently recorded in the ledger history and viewable by the world. This potentially reveals other information, such as the service's number of users. For privacy, it is best to:

- Avoid a direct mapping of user accounts (for example, in an exchange's internal system) to destination tags.
- Avoid a static mapping of user accounts to destination tags.
- Instead, use a dynamic mapping that allows for periodically rotating the tag to use.

The best way to use destination tags is to randomly assign them uniquely for each payment, so that even a single user on a given system will make use of many different tags. Note that user may send a payment in multiple transactions from separate source accounts. This provides better privacy. Save the mapping internally (e.g. "Deposit for destination tag #1234 is designated for user #9876"). You could even limit the tag with a short validity window, a period of time after which the tag should not be used. If an incoming payment has a destination tag that is not mapped to a user, you could send the money back with an error message.

Deleting entries from the mapping after some period of time would allow even the most popular service to avoid running out of destination tags.

There is a risk that a user will use an address/tag after it has been removed from the system, or after the service provider no longer wants any funds to be sent to that destination tag. This can also occur if a receiving account has been compromised or otherwise retired. Thus, an expiring address/tag is useful.

See "[Use cases for expiration](#use-cases-for-expiration)" for an overview of envisioned use cases for expiration.

## Limitations

We are not looking to change the on-ledger format; that is, the new style addresses can't be used for fields where an `AccountID` is expected in the binary format. Instead, the packed address will be detected and decoded at higher levels (for example, by the client software, `ripple-lib` or the RPC and WebSocket APIs in `rippled`), verified and then split into distinct fields (e.g. `sfDestination` and `sfDestinationTag`) as appropriate, to assemble the underlying transaction.

This new address style incorporates the destination tag, network ID, and expiration, and a checksum that ensures it has not been accidentally corrupted. By updating software to understand such Extended Addresses, we improve the UX, while intelligently unpacking such addresses into their constituent parts for the underlying system.

#### Limitations of expiration

The expiration can be enforced by the X address decoder, where an expired address will be detected as "invalid". The sender should refuse to send to the expired address, and the user should fetch a new address/tag from the service provider.

There are no changes to transactions or consensus for expiration support; it will be trivial for advanced users to override the expiration. However, it is a very valuable feature to have because defines a specific lifetime for an address/tag pair, sets expectations, and prevents user error.

## Options

Although we have options in developing a new format, including what encoding to use, ideally the resulting addresses will be similar to existing addresses to reduce the likelihood of user confusion as much as possible. Also, it should not require developers to implement a new codec.

Given this constraint, we need to use Base58 encoding, leaving us with two options:

1. A "tightly packed" format, where the account ID—or "classic address"—and tag are encoded using Base58Check as a single unit.
2. A "loosely packed" format, where the classic address is encoded using Base58Check and the destination tag is encoded separately and concatenated into the new address.

The advantage of the "loose" format is that a portion (or substring) of the tagged address will precisely match the classic address. The "tight" format results in an address that shares no common characters with the classic address, except, perhaps, by chance.

The "loose" format has a security advantage because it prevents a malicious actor from modifying the address in the conversion step without being detected. While not all users will care for this level of security, many advanced users will take advantage of this feature to visually observe that the tagged address contains the expected classic address and tag.

Furthermore, the format adds three additional benefits:
1. The network ID distinguishes addresses intended for production from those intended for test.
2. The checksum comes near the beginning of the address. Since the checksum is built on SHA256, it changes dramatically with any small change in the classic address and/or tag and/or network ID and/or expiration. This allows users to distinguish addresses by looking at them, if necessary.
3. An Extended Address is clearly distinct from a classic address because of its dissimilar initial letter. This is a benefit from a UX perspective because it is easy to distinguish Extended Addresses from classic addresses, which is necessary because not all software will immediately accept Extended Addresses in all of the places where classic addresses are currently accepted. This point will be elaborated upon later in this document.

As will be shown below, the format proposed here is not complex to detect, encode, or decode.

Though it is a "loose" format in the sense that the classic address and tag are readable within the new encoding, these extended addresses can be used as a full replacement for classic addresses in end-user UIs. The tag is optional, so even addresses not intended to be used with a tag can be encoded with this format.

Regardless of whether we choose a "tightly packed" or "loosely packed" format, developers will always need to be aware of the classic addresses and destination tags because they are used in the ledger itself, in transaction signing, and in transaction parsing and accounting.

## Status

This is only a proposal. It is intended to generate discussion between developers, community members and other interested parties, in hopes that that we will reach consensus on the way forward.

Comments, criticisms, suggestions and improvements are welcome!

### Advantages

The account ID, tag, network ID, and expiration are all are protected by the 32-bit checksum.

We can determine whether the address is an Extended Address by examining the initial character of the address: if it is `X` or `T` it is a packed address which may include a tag; if it is `r` it does not. If the initial character is anything else, the address is malformed.

The extended address's "suffix" is the same as the unpacked address, which is a security benefit for users (since it is clear which classic address is encoded in the extended address).

This consistency can be especially helpful for users in the context of trust lines, where the issuer of an asset must be explicitly trusted.

### Disadvantages

Support for Extended Addresses must be added to client software, which may take time.

Parsing an Extended Address is more complex than only parsing a classic address.

#### Amelioration

Users will be able to easily tell if the address they want to use is an X address or not, simply by looking at the first character.

Exchanges etc. can use explanatory verbiage such as: "We have added support for X addresses."

If "X address" sounds too colloquial, they can say: "We have added support for Extended Addresses." However, this may be less informative since it is not immediately obvious how to tell whether an address is an Extended Address or not.

For client software developers, to facilitate adoption and testing of the new format, open source Extended Address parsers will be included in `ripple-lib` and made available in multiple programming languages.

### Use cases for expiration

Often, accounts and/or destination tags should not be valid forever. Given XRP's fast transaction speed, it should be reasonable to have tags expire in relatively short periods of time. When generating an address, randomly assign a new destination tag to the user, as described above. Beyond that, here are some rough guidelines/expectations:

- **Exchanges:** It is reasonable to have the tag expire in 24-48 hours from generation, and indicate this fact to the client on the deposit page of the site. Internally, the exchange can allow some leeway for internal accounting, not deleting/invalidating the tag <-> client mapping for, say, 3 days. If the exchange wants or needs to transition away from the use of a particular account, expirations provide the exchange with some assurance that clients should stop sending to the old account after expiration. Exchanges should anticipate that deposit addresses may someday be compromised or have some other need to be migrated to a new address. To prevent forgetful clients from erroneously depositing to a retired address, deposit addresses should have an expiration when given to clients.
- **Merchants:** It is reasonable to have the tag expire shortly after the merchant expects the customer to send the payment. For example, if the merchant expects payment in about 2 minutes, the merchant can set the address to expire in 5 minutes. Remember that a customer can request a new address if they fail to make payment in the expected timeframe, and the merchant can (if it chooses) simply generate a new X Address for the same account and tag as before, merely extending the expiration.

Of course, shorter or longer expirations should be fine as well; it's a convenience trade-off. It's not a bad idea to set that an address expires in a year, for example; the account does not actually become invalid or anything. It is merely an indicator to the sender that they should check with the recipient (out of band) to make sure there isn't a different address that they would now prefer.

Expiration is optional in the X Address format, so service providers can generate addresses that never expire. It is only an additional layer of safety, akin to encoding tags in addresses: it eliminates a class of potential mistakes. Expirations are for convenience and do not affect anything in the ledger data or transaction data.

Note that this document simply describes a new address format; the underlying account in the ledger is unchanged, and never expires.

Generally, the rule of thumb is that the expiration should prevent misuse without extra knowledge or effort from users.

## Questions

Below is a list of questions and answers:

### What is the expected user experience (UX) for the wording and presentation of X Addresses?

During the transition period (about a year or two), the legacy address can be shown below the X address, if desired:

**XRP deposit address:** {rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 276 production 2019-12-31T23:59:59}

#### Legacy address

**Account:** rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf

**Destination tag:** 276

After a couple years, there should be no need to show the legacy address. Utilities and pages that convert an X Address to a legacy address will be widely known and can always be used in the rare case that conversion is needed.

For withdrawals, exchanges that currently provide a field to supply a destination tag can hide the field. If a classic address is entered in the destination address field, the page can then show the tag field.

### Should the format include both a source tag and a destination tag?

Probably not. It's better to simply state that the new format specifies an "address and tag" and to allow such addresses to be used both as a source and as a destination, and to decide the tag's type (source or destination) based on the field.

### Can we craft an encoding so that a packed address shares commonality with the actual address?

Yes, this proposal does this by encoding the classic address and destination tag separately and fusing the two components. Furthermore, the decoding process is not very complicated.

### There's potential for confusion. Can we help?

Users may not understand the semantics of an Extended Address sufficiently. This means that errors or confusion are possible as a result. Two exchange users might wonder why their deposit addresses are now different. Or one user may ask a friend what the deposit address is and, unknowingly, deposit funds into their friend's account.
The first is obviously not a problem with existing addresses, and the second is less likely to be an issue with single-use Extended Addresses. The UX of third parties that choose to use the new format will have to make it clear to users that the address is unique for them.

The server could add information to the metadata associated with a transaction to help tools to map addresses. For example, the server could add the following:

```
"ExtendedAddresses": [
    { 
        "{rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf 276 production 2019-12-31T23:59:59}": {
            "Address": "rGWrZyQqhTp9Xu7G5Pkayo7bXjH4k4QYpf",
            "Tag": 276,
            "Expiration": "2019-12-31T23:59:59"
        }
    }
]
```

### What happens if someone specifies one of these addresses in the binary format?

The short answer is that they can't. The serialization field only allows exactly 20 bytes, so only the account itself can fit in. This format is only for base58 encoded addresses and is purely a convenience for users.

### Should we integrate this natively into the protocol/ledger?

No, it would be a huge change and there aren't any apparent advantages. There are many risks. Allowing APIs to understand the new format sufficiently to decompose it into its two constituent fields should be sufficient.

### Why include a separator in addresses?

That way the checksum/expiration part is unambiguously separated from the tag part. The separator is **0** because using a non-alphanumeric character (like **#**) would complicate copy-pasting of addresses (with no double-click selection in several applications). Therefore an alphanumeric character outside the base58 alphabet was chosen, while still looking like part of the address. The separator assists with machine parsing of the address and does not intend to optimize for human readability. Also, since the tag that follows the zero is an unsigned integer in base 10 (digits 0-9), it is nice that a leading zero on an integer has no effect on its value.

## Acknowledgements

This document builds upon the [XLS-5d Standard for Tagged Addresses proposal](https://github.com/xrp-community/standards-drafts/issues/6) by Nikolaos D. Bougalis, the [BIP 173 format](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki), and had input from Arthur Britto, Bithomp, John Freeman, Joseph Busch, Markus Teufelberger, Wietse Wind, and other reviewers.

## Generation note

This `README.md` file is generated by [./src/docgen.ts](./src/docgen.ts), so do *not* modify it directly. Instead, modify [./src/README.md](./src/README.md) and then run: `yarn docgen`.
