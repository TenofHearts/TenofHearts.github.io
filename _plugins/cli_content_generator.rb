# Generates lightweight, mode-independent post fragments for the CLI reader.
require 'digest/sha1'

module Jekyll
  class CliContentGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      site.posts.docs.each do |post|
        lang = post.data['lang'].to_s
        next if lang.empty?

        relative_path = post.path.sub(%r{.*_posts/}, '')
        path_parts = relative_path.split('/')
        category = path_parts[0] || 'uncategorized'
        key = Digest::SHA1.hexdigest(post.path)[0, 16]
        content_url = "/cli/content/#{lang}/#{key}/"

        post.data['cli_category'] = category
        post.data['cli_name'] = cli_name(path_parts.last)
        post.data['cli_content_url'] = content_url
        post.data['cli_source_url'] = post.url

        page = PageWithoutAFile.new(site, site.source, "cli/content/#{lang}/#{key}", 'index.html')
        page.data['layout'] = 'cli-content'
        page.data['search'] = false
        page.data['sitemap'] = false
        page.data['lang'] = lang
        page.data['permalink'] = content_url
        converter = site.find_converter_instance(Jekyll::Converters::Markdown)
        page.content = converter.convert(post.content)
        site.pages << page
      end
    end

    private

    def cli_name(filename)
      filename.sub(/\.md\z/, '').sub(/\A\d{4}-\d{2}-\d{2}-/, '').sub(/-en\z/, '')
    end
  end
end
