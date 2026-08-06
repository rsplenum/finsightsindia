from finsight_content_factory_FIXED import run_factory, ArticleJob

job = ArticleJob(
    topic="The Section 270A 200% Penalty Trap",
    filename="the-section-270a-200-penalty-trap",
    category="tds",
    category_name="Direct Tax",
    protagonist="a freelancer caught claiming fake expenses",
    primary_fear="The algorithm catches a fake expense claim. What is the difference between 'under-reporting' (a 50% penalty) and 'misreporting' (a 200% penalty) under Section 270A?",
    alpha="Focus entirely on the difference between under-reporting and misreporting. Ensure there are deep mechanics on how the CPC algorithm flags this and how the Schneider Electric defense works."
)

run_factory(job, interactive_alpha=False)
