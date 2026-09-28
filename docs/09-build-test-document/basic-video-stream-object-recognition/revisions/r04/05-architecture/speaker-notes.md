# High-level architecture

## Speaker notes

Read this architecture from top to bottom. Mac tests and the iPhone debug harness are hosts around the same production pipeline.

The frame stream supplies timestamped images. The local catalog supplies the reference feature. The scorer measures visual distance, and the aggregator decides when repeated support forms an episode.

The recorder feeds an ordered log and a report builder. Images live separately, so the log stays structured and can rebuild report data without carrying image bytes.

The evaluator belongs to a separate development target. It knows the annotation zones used to judge the fixtures. The production package never sees those answers. This separation helps us test behavior without teaching the application the expected result.

## Fine print

- [Core package](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVision)
- [Harness](../../../../../../ios/AIShop/AIShop/Diagnostics)
- [Evaluator](../../../../../../ios/AIShop/AIShopVision/Sources/AIShopVisionEvaluation)
