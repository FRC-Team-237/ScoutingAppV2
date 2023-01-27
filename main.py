import jinja2

env = jinja2.Environment(loader=jinja2.FileSystemLoader("./"), trim_blocks=True, lstrip_blocks=True)

input_jinja = "./index.html.j2"
output_html = "./out/index.html"

index_in = env.get_template(input_jinja)
index_out = index_in.render()

with open(output_html, mode="w", encoding="utf-8") as page:
	page.write(index_out)
	print(f'Wrote to {output_html}')