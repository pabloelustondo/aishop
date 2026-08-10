# What AI Shop Is

HumanReviewerInitials: PME

AI Shop is Pablo's public experiment in using a phone camera and an AI
vision model as a second pair of eyes while grocery shopping. He has
several nearby supermarkets, none of them best on every product, and no
time to compare all of them on every trip. The project's founding
question is narrow and personal: help one person buy the products he
likes, at good quality and a good price, without visiting every store.

## The shape of the idea

Point an iPhone at a product or a shelf. The app sends the image to a
server that holds the OpenAI credential the phone is never trusted with.
The server asks a vision model to look at the image and returns a short,
readable report. The person reads it and decides — the system reports,
it does not decide.

## What it is not

It is not a barcode scanner or a price-comparison API integration; it
reasons over what the camera actually sees. It is not a shopping-list or
loyalty app — there are no accounts, carts, or catalogs yet. And it is
not positioned as an oracle: the newer half of the project exists
specifically to keep AI findings checkable rather than final.

## Where it's headed

The proof of concept already supports two kinds of scan (a single
product, or a whole shelf). The project's current direction — "auditable
retail shelf inspection" — adds durable storage of the original image
and a human review step, moving the system from a one-shot novelty
toward something closer to an inspection tool with a paper trail. See
[03-auditability.md](03-auditability.md) for why that shift matters.
