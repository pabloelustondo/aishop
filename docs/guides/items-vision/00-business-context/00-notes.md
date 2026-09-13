# 00 — Business Context: Understand What Is on the Shelf

## One-minute introduction
VISTA helps retail teams understand what is happening on store shelves.
They need to know which products are visible, how many facings each has,
and what changes between observations, to support inventory decisions,
brand presentation, and sales.

Look at the two shelf photos: they make the business question concrete.
A person captures shelf evidence so it can be analysed and reviewed.
The aim is to reduce manual inspection effort while retaining the image
that lets someone check the findings.

The module we are about to explore handles one part of that bigger story.
A user uploads a shelf photo, the server coordinates AI analysis,
and the browser presents identified products and visible facing counts.
A facing is a visible product front, not the stock hidden behind it.
The observations can be uncertain and need review.

Keep that user journey in mind as we move into the architecture:
photo in, reviewable item report out.

## Reading context and scope
The broader introduction is the [VISTA LinkedIn overview](../../VISTA-Linkedin-Overview-Presentation.pdf).
This technical guide assumes that background; this slide is a brief refresher.
Selected visual: PDF page 2, “Teams need to understand what is happening across stores”.
It uses original field examples and connects the images to the business questions.
Comparisons across visits describe the wider business intent, not a claim that
this uploader module already performs automatic change detection.

## Visual walkthrough
Point to the before-and-after photos, then the three questions on the right.
Close with the need for readable shelf images and move to slide 01's architecture.
The visual retains its original PDF footer number, 02; this guide numbers it 00.
